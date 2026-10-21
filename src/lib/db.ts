import { PrismaClient } from "@prisma/client";

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL connection string. On Vercel, set it in Project Settings → Environment Variables (Neon or Vercel Postgres). Locally use docker compose or the same hosted URL.",
    );
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
