import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
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

if (process.env.VERCEL && process.env.DATABASE_URL.startsWith("file:")) {
  run("npx", ["prisma", "db", "seed"]);
}
