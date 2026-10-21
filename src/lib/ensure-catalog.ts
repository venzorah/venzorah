import { prisma } from "./db";

const globalForSeed = globalThis as unknown as { catalogSeed?: Promise<void> };

export async function ensureDemoCatalog() {
  if (process.env.SKIP_DEMO_SEED === "1") return;
  const published = await prisma.product.count({ where: { status: "PUBLISHED" } });
  if (published > 0) return;
  if (!globalForSeed.catalogSeed) {
    globalForSeed.catalogSeed = import("../../prisma/seed")
      .then((mod) => mod.seedDemoData())
      .finally(() => {
        globalForSeed.catalogSeed = undefined;
      });
  }
  await globalForSeed.catalogSeed;
}