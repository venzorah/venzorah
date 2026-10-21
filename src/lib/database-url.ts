const CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
] as const;

function clean(value: string) {
  return value
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^["']|["']$/g, "");
}

export function normalizePostgresUrl(raw: string) {
  const value = clean(raw);
  if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) return "";
  try {
    const parsed = new URL(value);
    parsed.searchParams.delete("channel_binding");
    if (/neon\.tech|vercel-storage\.com|supabase\./.test(parsed.hostname)) {
      const mode = parsed.searchParams.get("sslmode");
      if (!mode || mode === "prefer" || mode === "verify-full" || mode === "verify-ca") {
        parsed.searchParams.set("sslmode", "require");
      }
    }
    return parsed.toString();
  } catch {
    return value;
  }
}

export function directPostgresUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname.includes("-pooler")) {
    parsed.hostname = parsed.hostname.replace("-pooler", "");
  }
  parsed.searchParams.delete("pgbouncer");
  return parsed.toString();
}

export function isLocalPostgresUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function findDatabaseUrl() {
  for (const key of CANDIDATES) {
    const url = normalizePostgresUrl(process.env[key] ?? "");
    if (url) return { key, url };
  }
  return null;
}

export function resolveDatabaseUrl() {
  const found = findDatabaseUrl();
  if (!found) {
    throw new Error(
      "A PostgreSQL URL is required. Set DATABASE_URL, or use a Vercel/Neon integration (POSTGRES_URL). Do not use a sqlite file: URL.",
    );
  }
  return found.url;
}