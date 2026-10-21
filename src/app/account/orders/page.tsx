import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatGbp } from "@/lib/money";
import { Badge, PageHeader, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { vendorOrders: { include: { vendor: true } } },
    orderBy: { placedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Orders" />
      {orders.length === 0 ? (
        <EmptyState title="No orders yet." />
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{o.number}</p>
                  <p className="text-sm text-muted">{formatDate(o.placedAt)}</p>
                </div>
                <Badge>{o.status}</Badge>
              </div>
              <p className="mt-2 text-sm">
                {o.vendorOrders.map((v) => v.vendor.storeName).join(", ")} · {formatGbp(o.totalPence)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
