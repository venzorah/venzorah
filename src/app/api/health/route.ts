import { findDatabaseUrl, isLocalPostgresUrl } from "@/lib/database-url";
import { prisma } from "@/lib/db";
import { ensureDemoCatalog } from "@/lib/ensure-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const found = findDatabaseUrl();
  const configured = Boolean(found);
  const local = found ? isLocalPostgresUrl(found.url) : false;
  try {
    const ready = await ensureDemoCatalog();
    if (!ready) {
      return Response.json({ ok: false, service: "venzorah", configured, local, products: 0, reason: "unavailable" });
    }
    const products = await prisma.product.count({ where: { status: "PUBLISHED" } });
    return Response.json({ ok: true, service: "venzorah", configured, local, products });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    return Response.json({
      ok: false,
      service: "venzorah",
      configured,
      local,
      products: 0,
      reason: code || "error",
    });
  }
}
