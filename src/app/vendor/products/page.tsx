import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Badge, Button, PageHeader } from "@/components/ui";

export default async function VendorProductsPage() {
  const user = await requirePermission("vendor.product.create");
  const products = await prisma.product.findMany({
    where: { vendorId: user.vendorId! },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeader
        title="Products"
        action={
          <Link href="/vendor/products/new">
            <Button>New product</Button>
          </Link>
        }
      />
      <div className="grid gap-3">
        {products.map((p) => (
          <Link key={p.id} href={`/vendor/products/${p.id}`} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-muted">{p.category.name}</p>
              </div>
              <Badge>{p.status}</Badge>
            </div>
            {p.rejectionReason ? <p className="mt-2 text-sm text-error">{p.rejectionReason}</p> : null}
          </Link>
        ))}
      </div>
    </>
  );
}
