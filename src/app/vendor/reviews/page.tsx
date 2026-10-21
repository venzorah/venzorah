import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export default async function VendorReviewsPage() {
  const user = await requirePermission("vendor.store.manage");
  const reviews = await prisma.review.findMany({
    where: { product: { vendorId: user.vendorId! } },
    include: { product: true, user: true },
  });
  return (
    <>
      <PageHeader title="Store reviews" />
      <ul className="grid gap-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
            {r.product.name} · {r.rating}/5 · {r.user.name}
            <p className="text-sm">{r.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
