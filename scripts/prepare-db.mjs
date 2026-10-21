import { spawnSync } from "node:child_process";

function clean(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^["']|["']$/g, "");
}

function normalize(raw) {
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

function directUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname.includes("-pooler")) parsed.hostname = parsed.hostname.replace("-pooler", "");
  parsed.searchParams.delete("pgbouncer");
  return parsed.toString();
}

const keys = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
];

let runtime = { key: "", url: "" };
for (const key of keys) {
  const url = normalize(process.env[key]);
  if (url) {
    runtime = { key, url };
    break;
  }
}

if (!runtime.url) {
  console.error("No PostgreSQL URL found.");
  process.exit(1);
}

const directKeys = ["POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED", "DIRECT_URL"];
let schemaUrl = runtime.url;
for (const key of directKeys) {
  const url = normalize(process.env[key]);
  if (url) {
    schemaUrl = url;
    break;
  }
}
if (schemaUrl === runtime.url) schemaUrl = directUrl(runtime.url);

function run(script, args, databaseUrl) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  if (result.error) {
    console.error(result.error);
    return false;
  }
  return result.status === 0;
}

const redacted = schemaUrl.replace(/:\/\/[^@]+@/, "://***@");
console.log(`prepare-db: schema push via ${redacted}`);
let pushed = run("node_modules/prisma/build/index.js", ["db", "push", "--skip-generate", "--accept-data-loss"], schemaUrl);
if (!pushed && schemaUrl !== runtime.url) {
  console.error("Direct Postgres push failed. Retrying with the runtime URL.");
  pushed = run("node_modules/prisma/build/index.js", ["db", "push", "--skip-generate", "--accept-data-loss"], runtime.url);
}
if (!pushed) process.exit(1);

if (process.env.SKIP_DEMO_SEED !== "1") {
  const seeded = run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"], schemaUrl);
  if (!seeded) {
    console.error("Demo seed failed. An empty database is seeded on the first storefront visit.");
  }
}