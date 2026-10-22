import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import { prisma } from "./db";
import { createSession } from "./auth";
import { takeAuthReturn } from "./auth-return";
import { ROLE_KEYS } from "./permissions";

export const OAUTH_PROVIDERS = ["google", "facebook", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export type AuthPortal = "buyer" | "seller";

const STATE_COOKIE = "venzorah_oauth_state";
const PORTAL_COOKIE = "venzorah_oauth_portal";
const PROVIDER_COOKIE = "venzorah_oauth_provider";
const APPLE_KEYS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export function getAppUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  extraAuthorize?: Record<string, string>;
};

export function oauthCallbackUrl(provider: OAuthProvider) {
  return `${getAppUrl()}/api/auth/oauth/${provider}/callback`;
}

export async function getProviderConfig(provider: OAuthProvider): Promise<ProviderConfig | null> {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
    };
  }
  if (provider === "facebook") {
    const clientId = process.env.FACEBOOK_APP_ID ?? "";
    const clientSecret = process.env.FACEBOOK_APP_SECRET ?? "";
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
      scope: "email public_profile",
    };
  }
  const clientId = process.env.APPLE_CLIENT_ID ?? "";
  const teamId = process.env.APPLE_TEAM_ID ?? "";
  const keyId = process.env.APPLE_KEY_ID ?? "";
  const privateKey = (process.env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!clientId || !teamId || !keyId || !privateKey) return null;
  const key = await importPKCS8(privateKey, "ES256");
  const clientSecret = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("180d")
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);
  return {
    clientId,
    clientSecret,
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    scope: "name email",
    extraAuthorize: { response_mode: "form_post" },
  };
}

export async function startOAuth(provider: OAuthProvider, portal: AuthPortal) {
  const config = await getProviderConfig(provider);
  if (!config) {
    redirect(`/login?portal=${portal}&error=${provider}_not_configured`);
  }
  const state = randomBytes(24).toString("hex");
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, cookieOpts(600));
  jar.set(PORTAL_COOKIE, portal, cookieOpts(600));
  jar.set(PROVIDER_COOKIE, provider, cookieOpts(600));
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", oauthCallbackUrl(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (provider === "google") url.searchParams.set("prompt", "select_account");
  if (config.extraAuthorize) {
    for (const [key, value] of Object.entries(config.extraAuthorize)) {
      url.searchParams.set(key, value);
    }
  }
  redirect(url.toString());
}

type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  image?: string | null;
};

async function exchangeCode(provider: OAuthProvider, code: string) {
  const config = await getProviderConfig(provider);
  if (!config) return null;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: oauthCallbackUrl(provider),
  });
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    access_token?: string;
    id_token?: string;
  };
}

async function loadProfile(provider: OAuthProvider, tokens: { access_token?: string; id_token?: string }, appleName?: string) {
  if (provider === "google") {
    if (!tokens.access_token) return null;
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string; email?: string; name?: string; picture?: string };
    if (!data.id || !data.email) return null;
    return {
      provider,
      providerAccountId: data.id,
      email: data.email.toLowerCase(),
      name: data.name || data.email.split("@")[0],
      image: data.picture ?? null,
    } satisfies OAuthProfile;
  }
  if (provider === "facebook") {
    if (!tokens.access_token) return null;
    const url = new URL("https://graph.facebook.com/me");
    url.searchParams.set("fields", "id,name,email,picture.type(large)");
    url.searchParams.set("access_token", tokens.access_token);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };
    if (!data.id || !data.email) return null;
    return {
      provider,
      providerAccountId: data.id,
      email: data.email.toLowerCase(),
      name: data.name || data.email.split("@")[0],
      image: data.picture?.data?.url ?? null,
    } satisfies OAuthProfile;
  }
  if (!tokens.id_token) return null;
  const config = await getProviderConfig("apple");
  if (!config) return null;
  const { payload } = await jwtVerify(tokens.id_token, APPLE_KEYS, {
    issuer: "https://appleid.apple.com",
    audience: config.clientId,
  });
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub || !email) return null;
  return {
    provider,
    providerAccountId: sub,
    email,
    name: appleName || email.split("@")[0],
    image: null,
  } satisfies OAuthProfile;
}

export function oauthErrorPath(error: string, portal: AuthPortal) {
  return `/login?portal=${portal}&error=${error}`;
}

export async function finishOAuth(provider: OAuthProvider, code: string | null, state: string | null, appleUser?: string | null) {
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  const storedProvider = jar.get(PROVIDER_COOKIE)?.value;
  const portal: AuthPortal = jar.get(PORTAL_COOKIE)?.value === "seller" ? "seller" : "buyer";
  jar.delete(STATE_COOKIE);
  jar.delete(PORTAL_COOKIE);
  jar.delete(PROVIDER_COOKIE);
  if (!code || !state || !expected || state !== expected || storedProvider !== provider) {
    redirect(oauthErrorPath("oauth_denied", portal));
  }
  const tokens = await exchangeCode(provider, code);
  if (!tokens) redirect(oauthErrorPath("oauth_failed", portal));
  let appleName: string | undefined;
  if (appleUser) {
    try {
      const parsed = JSON.parse(appleUser) as { name?: { firstName?: string; lastName?: string } };
      appleName = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ") || undefined;
    } catch {
      appleName = undefined;
    }
  }
  let profile: OAuthProfile | null = null;
  try {
    profile = await loadProfile(provider, tokens, appleName);
  } catch {
    profile = null;
  }
  if (!profile) redirect(oauthErrorPath("oauth_email", portal));

  const existingLink = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });
  let user = existingLink?.user ?? null;
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: profile.email },
      include: { roles: { include: { role: true } } },
    });
    if (user) {
      await prisma.oAuthAccount.create({
        data: { userId: user.id, provider, providerAccountId: profile.providerAccountId },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.image ?? undefined,
          emailVerifiedAt: new Date(),
          customer: { create: {} },
          roles: { create: { role: { connect: { key: ROLE_KEYS.CUSTOMER } } } },
          oauthAccounts: { create: { provider, providerAccountId: profile.providerAccountId } },
        },
        include: { roles: { include: { role: true } } },
      });
    }
  } else if (profile.image && !user.image) {
    await prisma.user.update({ where: { id: user.id }, data: { image: profile.image } });
  }

  if (user.status === "SUSPENDED") redirect(oauthErrorPath("oauth_suspended", portal));
  await createSession(user.id, 30);
  try {
    const { mergeGuestCart } = await import("./store-checkout");
    await mergeGuestCart(user.id);
  } catch (error) {
    console.error("[cart] guest basket was not merged", error instanceof Error ? error.message : error);
  }
  const next = await takeAuthReturn();
  const keys = user.roles.map((r) => r.role.key);
  if (portal !== "seller" && next) redirect(next);
  if (portal === "seller") {
    if (keys.includes(ROLE_KEYS.VENDOR) || keys.includes(ROLE_KEYS.ADMIN)) redirect("/vendor");
    redirect("/sell-on-venzorah");
  }
  if (keys.includes(ROLE_KEYS.ADMIN)) redirect("/admin");
  if (keys.includes(ROLE_KEYS.VENDOR)) redirect("/vendor");
  redirect("/account");
}
