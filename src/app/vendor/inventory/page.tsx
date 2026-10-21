import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { updateVendorStock } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";

export default async function InventoryPage() {
  const user = await requirePermission("vendor.inventory.manage");
  const variants = await prisma.productVariant.findMany({
    where: { product: { vendorId: user.vendorId! } },
    include: { product: true, movements: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
  return (
    <>
      <PageHeader title="Inventory" description="Stock updates are transactional to prevent overselling." />
      <div className="grid gap-3">
        {variants.map((v) => (
          <section key={v.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">
              {v.product.name} · {v.name}
            </p>
            <p className="text-sm">SKU {v.sku ?? "—"} · Stock {v.stock} {v.stock < 5 ? "· low stock" : ""}</p>
            <form
              className="mt-2 flex gap-2"
              action={async (fd) => {
                "use server";
                await updateVendorStock(v.id, Number(fd.get("stock")));
              }}
            >
              <input name="stock" type="number" defaultValue={v.stock} className="tap-target w-24 rounded-xl border px-2" />
              <Button type="submit" variant="secondary">
                Update
              </Button>
            </form>
          </section>
        ))}
      </div>
    </>
  );
}
