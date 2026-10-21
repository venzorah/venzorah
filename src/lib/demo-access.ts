import { createHmac, createHash, timingSafeEqual } from "crypto";
import {
  ADMIN_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
  ROLE_KEYS,
  VENDOR_PERMISSIONS,
  type PermissionKey,
} from "./permissions";
import type { AuthUser } from "./auth";

const DEMO_PREFIX = "demo.";
const DEMO_SECRET = "venzorah-demo-session-v1";

const CUSTOMER_ROLES = [ROLE_KEYS.CUSTOMER];
const VENDOR_ROLES = [ROLE_KEYS.CUSTOMER, ROLE_KEYS.VENDOR, ROLE_KEYS.VERIFIED_VENDOR];
const ADMIN_ROLES = [ROLE_KEYS.ADMIN, ROLE_KEYS.CUSTOMER, ROLE_KEYS.VENDOR, ROLE_KEYS.VERIFIED_VENDOR];

function unique(keys: PermissionKey[]) {
  return [...new Set(keys)];
}

type DemoAccount = AuthUser & { password: string };

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-customer",
    email: "customer@venzorah.com",
    name: "Ada Customer",
    password: "VenzorahCustomer!23",
    image: null,
    status: "ACTIVE",
    roles: CUSTOMER_ROLES,
    permissions: [...CUSTOMER_PERMISSIONS],
    vendorId: null,
  },
  {
    id: "demo-vendor-amina",
    email: "vendor@venzorah.com",
    name: "Amina Vendor",
    password: "VenzorahVendor!23",
    image: null,
    status: "ACTIVE",
    roles: VENDOR_ROLES,
    permissions: unique([...CUSTOMER_PERMISSIONS, ...VENDOR_PERMISSIONS]),
    vendorId: "demo-vendor-amina",
  },
  {
    id: "demo-vendor-kwame",
    email: "vendor2@venzorah.com",
    name: "Kwame Vendor",
    password: "VenzorahVendor!23",
    image: null,
    status: "ACTIVE",
    roles: VENDOR_ROLES,
    permissions: unique([...CUSTOMER_PERMISSIONS, ...VENDOR_PERMISSIONS]),
    vendorId: "demo-vendor-kwame",
  },
  {
    id: "demo-vendor-house",
    email: "house@venzorah.com",
    name: "Accra House",
    password: "VenzorahVendor!23",
    image: null,
    status: "ACTIVE",
    roles: VENDOR_ROLES,
    permissions: unique([...CUSTOMER_PERMISSIONS, ...VENDOR_PERMISSIONS]),
    vendorId: "demo-vendor-house",
  },
  {
    id: "demo-admin",
    email: "venzorah.app@gmail.com",
    name: "Venzorah Admin",
    password: "Utomobong#@01",
    image: null,
    status: "ACTIVE",
    roles: ADMIN_ROLES,
    permissions: [...ADMIN_PERMISSIONS],
    vendorId: "demo-admin-vendor",
  },
];

function sameSecret(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

function publicUser(account: DemoAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    image: account.image,
    status: account.status,
    roles: account.roles,
    permissions: account.permissions,
    vendorId: account.vendorId,
  };
}

export function matchDemoAccount(email: string, password: string): AuthUser | null {
  const account = DEMO_ACCOUNTS.find((user) => user.email === email);
  if (!account || !sameSecret(account.password, password)) return null;
  return publicUser(account);
}

export function sessionDestination(roles: string[], portal: string) {
  if (portal === "admin") return "/admin";
  if (portal === "seller") {
    return roles.includes(ROLE_KEYS.VENDOR) || roles.includes(ROLE_KEYS.ADMIN) ? "/vendor" : "/sell-on-venzorah";
  }
  if (roles.includes(ROLE_KEYS.ADMIN)) return "/admin";
  if (roles.includes(ROLE_KEYS.VENDOR)) return "/vendor";
  return "/account";
}

export function signDemoToken(userId: string, days = 14, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: now + days * 24 * 60 * 60 * 1000 })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", DEMO_SECRET).update(payload).digest("base64url");
  return `${DEMO_PREFIX}${payload}.${sig}`;
}

export function isDemoToken(token: string) {
  return token.startsWith(DEMO_PREFIX);
}

export function readDemoToken(token: string, now = Date.now()): AuthUser | null {
  if (!isDemoToken(token)) return null;
  const payload = token.slice(DEMO_PREFIX.length);
  const dot = payload.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = payload.slice(0, dot);
  const sig = payload.slice(dot + 1);
  const expected = createHmac("sha256", DEMO_SECRET).update(body).digest("base64url");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let parsed: { id?: string; exp?: number };
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { id?: string; exp?: number };
  } catch {
    return null;
  }
  if (!parsed.id || typeof parsed.exp !== "number" || parsed.exp <= now) return null;
  const account = DEMO_ACCOUNTS.find((user) => user.id === parsed.id);
  if (!account) return null;
  return publicUser(account);
}

export function isDatabaseFailure(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  if (/^P1\d{3}$/.test(code) || code === "P2021" || code === "P2022") return true;
  const message = error instanceof Error ? error.message : "";
  return /PostgreSQL URL is required|DATABASE_URL points at localhost|Can't reach database server|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Invalid `prisma\./i.test(
    message,
  );
}
