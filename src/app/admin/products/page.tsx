import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminModerateProduct } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";

export default async function AdminProductsPage() {
  await requirePermission("admin.product.moderate");
  const products = await prisma.product.findMany({
    where: { status: { in: ["PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"] } },
    include: { vendor: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Product moderation" />
      <div className="grid gap-3">
        {products.map((p) => (
          <section key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">
              {p.name} · {p.status}
            </p>
            <p className="text-sm">
              {p.vendor.storeName} · {p.category.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <form action={async () => { "use server"; await adminModerateProduct(p.id, "PUBLISHED"); }}>
                <Button type="submit">Approve</Button>
              </form>
              <form action={async () => { "use server"; await adminModerateProduct(p.id, "REJECTED", "Please revise listing details."); }}>
                <Button type="submit" variant="secondary">
                  Reject
                </Button>
              </form>
              <form action={async () => { "use server"; await adminModerateProduct(p.id, "SUSPENDED", "Removed pending investigation."); }}>
                <Button type="submit" variant="danger">
                  Suspend
                </Button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
