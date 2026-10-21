const CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
] as const;

function isPostgresUrl(url: string) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export function resolveDatabaseUrl() {
  for (const key of CANDIDATES) {
    const url = process.env[key] ?? "";
    if (isPostgresUrl(url)) return url;
  }
  throw new Error(
    "A PostgreSQL URL is required. Set DATABASE_URL, or use a Vercel/Neon integration (POSTGRES_URL). Do not use a sqlite file: URL.",
  );
}