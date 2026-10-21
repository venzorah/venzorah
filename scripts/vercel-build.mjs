import { spawnSync } from "node:child_process";

function clean(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^["']|["']$/g, "");
}

function isPostgresUrl(url) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

function isLocal(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

const keys = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
];

let found = null;
for (const key of keys) {
  const url = clean(process.env[key]);
  if (isPostgresUrl(url) && !isLocal(url)) {
    found = { key, url };
    break;
  }
}

function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (result.error) {
    console.error(result.error);
    return result.status ?? 1;
  }
  return result.status ?? 1;
}

if (!found) {
  const present = Object.keys(process.env).filter((key) => /DATABASE|POSTGRES|DIRECT_URL|NEON/i.test(key));
  console.warn("Skipping database setup. Vercel has no remote PostgreSQL URL at build time.");
  console.warn(
    present.length
      ? `Related env keys visible at build time: ${present.join(", ")}`
      : "No DATABASE or POSTGRES env keys are visible at build time.",
  );
  console.warn(
    "Set DATABASE_URL to a Neon or Vercel Postgres URI (not localhost) for Production and Preview, and include it in Builds. The storefront seeds an empty database on the first visit.",
  );
} else {
  console.log(`vercel-build: database URL taken from ${found.key}`);
  const status = run(["scripts/prepare-db.mjs"], { ...process.env, DATABASE_URL: found.url });
  if (status !== 0) {
    console.error("Database setup failed. Continuing so Next.js can still build.");
  }
}

const buildStatus = run(["node_modules/next/dist/bin/next", "build"]);
process.exit(buildStatus);
