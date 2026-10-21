import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl() {
  const existing = process.env.DATABASE_URL;
  if (existing && !existing.startsWith("file:")) {
    return existing;
  }

  const fileUrl = existing?.startsWith("file:") ? existing : "file:./dev.db";
  if (!process.env.VERCEL) {
    return fileUrl;
  }

  const tmpPath = "/tmp/venzorah.db";
  const bundled = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "dev.db"),
  ].find((candidate) => existsSync(candidate));
  if (bundled) copyFileSync(bundled, tmpPath);
  return `file:${tmpPath}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
