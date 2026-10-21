import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Badge, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function VendorOrdersPage() {
  const user = await requirePermission("vendor.order.manage");
  const orders = await prisma.vendorOrder.findMany({
    where: { vendorId: user.vendorId! },
    include: { order: true, items: true },
    orderBy: { order: { placedAt: "desc" } },
  });
  return (
    <>
      <PageHeader title="Vendor orders" description="You only see items sold from your store." />
      <div className="grid gap-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/vendor/orders/${o.id}`} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between">
              <span className="font-bold">{o.order.number}</span>
              <Badge>{o.status}</Badge>
            </div>
            <p className="text-sm">{formatGbp(o.vendorNetPence)} net after {o.commissionBps / 100}% commission</p>
          </Link>
        ))}
      </div>
    </>
  );
}
