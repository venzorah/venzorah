import { spawnSync } from "node:child_process";

function isPostgresUrl(url) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

function firstPostgresUrl(keys) {
  for (const key of keys) {
    const url = String(process.env[key] ?? "")
      .trim()
      .replace(/^["']|["']$/g, "");
    if (isPostgresUrl(url)) return { key, url };
  }
  return { key: "", url: "" };
}

function withSsl(url) {
  if (url.includes("sslmode=")) return url;
  if (/neon\.tech|vercel-storage\.com|supabase\.co/.test(url)) {
    return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
  }
  return url;
}

function forSchemaPush(url) {
  return withSsl(url.replace("-pooler.", "."));
}

const runtime = firstPostgresUrl([
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
]);

if (!runtime.url) {
  console.error(
    "No PostgreSQL URL found. Set DATABASE_URL for Production and Preview (available at Build time), or connect Neon/Vercel Postgres so POSTGRES_URL is present. A leftover file: SQLite URL is ignored.",
  );
  process.exit(1);
}

const migrate = firstPostgresUrl(["DIRECT_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"]);
const schemaUrl = forSchemaPush(migrate.url || runtime.url);
const redacted = schemaUrl.replace(/:\/\/[^@]+@/, "://***@");
console.log(`prepare-db: using ${migrate.url ? migrate.key : runtime.key} (${redacted})`);

function run(script, args, extraEnv = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node_modules/prisma/build/index.js", ["db", "push", "--skip-generate"], { DATABASE_URL: schemaUrl });

if (process.env.SKIP_DEMO_SEED !== "1") {
  run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"], { DATABASE_URL: schemaUrl });
}