import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
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

const skipSeed = process.env.SKIP_DEMO_SEED === "1";
if (!skipSeed) {
  run("npx", ["prisma", "db", "seed"]);
}

if (process.env.DATABASE_URL.startsWith("file:")) {
  const fromPrisma = path.join(process.cwd(), "prisma", "dev.db");
  const fromRoot = path.join(process.cwd(), "dev.db");
  if (existsSync(fromPrisma) && !existsSync(fromRoot)) {
    copyFileSync(fromPrisma, fromRoot);
  }
}
