import { spawnSync } from "node:child_process";

const KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
];

function clean(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function isPostgresUrl(url) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

let foundKey = "";
let foundUrl = "";
for (const key of KEYS) {
  const url = clean(process.env[key]);
  if (isPostgresUrl(url)) {
    foundKey = key;
    foundUrl = url;
    break;
  }
}

if (!foundUrl) {
  const present = Object.keys(process.env).filter((key) => /DATABASE|POSTGRES|DIRECT_URL|NEON/i.test(key));
  console.error("No PostgreSQL URL is available to this Vercel build.");
  console.error(
    present.length
      ? `Related env keys visible at build time: ${present.join(", ")}`
      : "No DATABASE or POSTGRES env keys are visible at build time.",
  );
  console.error(
    "In Vercel → Settings → Environment Variables, set DATABASE_URL (or connect Neon so POSTGRES_URL exists) for Production and Preview, and include it in Builds. Then redeploy.",
  );
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: foundUrl };
console.log(`vercel-build: DATABASE_URL taken from ${foundKey}`);

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["scripts/prepare-db.mjs"]);
run(["node_modules/next/dist/bin/next", "build"]);
