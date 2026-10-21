import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { prisma } from "./db";
import { isDemoToken, readDemoToken, signDemoToken } from "./demo-access";
import type { PermissionKey } from "./permissions";

export const SESSION_COOKIE = "venzorah_session";
const SESSION_DAYS = 14;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  vendorId?: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string | null | undefined) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, days = SESSION_DAYS) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const hdrs = await headers();
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: hdrs.get("user-agent") ?? undefined,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return token;
}

export async function createDemoSession(userId: string, days = SESSION_DAYS) {
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signDemoToken(userId, days), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && !isDemoToken(token)) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

async function authDatabaseReady() {
  try {
    await prisma.user.findFirst({ select: { id: true } });
    return true;
  } catch {
    return false;
  }
}

async function loadPermissions(userId: string, roleKeys: string[]) {
  const roles = await prisma.role.findMany({
    where: { key: { in: roleKeys } },
    include: { permissions: { include: { permission: true } } },
  });
  const fromRoles = new Set(roles.flatMap((r) => r.permissions.map((p) => p.permission.key)));
  const overrides = await prisma.permissionOverride.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  for (const o of overrides) {
    if (o.allowed) fromRoles.add(o.permissionKey);
    else fromRoles.delete(o.permissionKey);
  }
  return [...fromRoles];
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (isDemoToken(token)) {
    const demo = readDemoToken(token);
    if (!demo || (await authDatabaseReady())) return null;
    return demo;
  }
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
            vendor: true,
          },
        },
      },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    if (session.user.status === "SUSPENDED") return null;
    const roleKeys = session.user.roles.map((r) => r.role.key);
    const permissions = await loadPermissions(session.user.id, roleKeys);
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      status: session.user.status,
      roles: roleKeys,
      permissions,
      vendorId: session.user.vendor?.id ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(loginHref = "/login") {
  const user = await getSessionUser();
  if (!user) redirect(loginHref);
  return user;
}

export async function requirePermission(
  key: PermissionKey | PermissionKey[],
  options?: { loginHref?: string },
) {
  const user = await requireUser(options?.loginHref ?? "/login");
  const keys = Array.isArray(key) ? key : [key];
  const ok = keys.some((k) => user.permissions.includes(k));
  if (!ok) redirect("/forbidden");
  return user;
}

export function hasPermission(user: AuthUser | null, key: PermissionKey) {
  return Boolean(user?.permissions.includes(key));
}

export async function createAuthToken(userId: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD") {
  const raw = randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  return raw;
}

export async function consumeAuthToken(raw: string, type: string) {
  const token = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) return null;
  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return token;
}

const loginAttempts = new Map<string, { count: number; ts: number }>();

export function rateLimitLogin(key: string, limit = 8) {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || now - rec.ts > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, ts: now });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  return true;
}
