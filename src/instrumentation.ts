export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureDemoCatalog } = await import("@/lib/ensure-catalog");
  await ensureDemoCatalog();
}
