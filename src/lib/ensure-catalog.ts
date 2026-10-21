import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "./db";

const globalForSeed = globalThis as unknown as {
  catalogSeed?: Promise<boolean>;
  catalogReady?: boolean;
  catalogFailedAt?: number;
};

export function dbErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgresql://***").slice(0, 400);
}

function isMissingSchema(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "P2021" || code === "P2022") return true;
  return /does not exist/i.test(dbErrorText(error));
}

function initStatements() {
  const sql = readFileSync(path.join(process.cwd(), "prisma", "sql", "init.sql"), "utf8");
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.trim())
    .filter((part) => part.replace(/--[^\n]*/g, "").trim().length > 0);
}

async function applyInitSchema() {
  for (const statement of initStatements()) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      if (/already exists/i.test(dbErrorText(error))) continue;
      throw error;
    }
  }
}

async function prepareCatalog() {
  let published = 0;
  try {
    published = await prisma.product.count({ where: { status: "PUBLISHED" } });
  } catch (error) {
    if (!isMissingSchema(error)) throw error;
    console.warn("Database schema is missing. Creating tables.");
    await applyInitSchema();
    published = 0;
  }
  if (published > 0) {
    globalForSeed.catalogReady = true;
    return true;
  }
  if (process.env.SKIP_DEMO_SEED === "1") return false;
  const { seedDemoData } = await import("../../prisma/seed");
  await seedDemoData();
  globalForSeed.catalogReady = true;
  return true;
}

export async function ensureDemoCatalog() {
  if (globalForSeed.catalogReady) return true;
  if (globalForSeed.catalogFailedAt && Date.now() - globalForSeed.catalogFailedAt < 15_000) return false;
  if (!globalForSeed.catalogSeed) {
    globalForSeed.catalogSeed = prepareCatalog()
      .catch((error) => {
        globalForSeed.catalogFailedAt = Date.now();
        console.error("Catalogue setup failed:", dbErrorText(error));
        return false;
      })
      .finally(() => {
        globalForSeed.catalogSeed = undefined;
      });
  }
  return globalForSeed.catalogSeed;
}
