import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!url || url.startsWith("file:")) {
  console.error(
    "DATABASE_URL must be a PostgreSQL URL. Set it in Vercel env vars (and locally in .env). Example: postgresql://venzorah:venzorah@localhost:5432/venzorah",
  );
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "db", "push", "--skip-generate"]);

if (process.env.SKIP_DEMO_SEED !== "1") {
  run("npx", ["prisma", "db", "seed"]);
}
