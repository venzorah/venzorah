import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminResolveDispute } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function AdminOrdersPage() {
  await requirePermission("admin.order.manage");
  const [orders, disputes] = await Promise.all([
    prisma.order.findMany({ include: { user: true, vendorOrders: true }, orderBy: { placedAt: "desc" }, take: 40 }),
    prisma.dispute.findMany({ where: { status: { in: ["OPEN", "INVESTIGATING"] } }, include: { vendorOrder: { include: { order: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Orders and disputes" />
      <h2 className="mb-3 font-bold">Open disputes</h2>
      <div className="grid gap-3">
        {disputes.map((d) => (
          <form
            key={d.id}
            className="rounded-2xl border border-border bg-card p-4"
            action={async () => {
              "use server";
              await adminResolveDispute(d.id, "RESOLVED", Math.round(d.vendorOrder.vendorNetPence / 2));
            }}
          >
            <p>
              {d.vendorOrder.order.number} · {d.type} · {d.reason}
            </p>
            <Button type="submit" className="mt-2">
              Resolve with partial refund
            </Button>
          </form>
        ))}
      </div>
      <h2 className="mt-8 mb-3 font-bold">Orders</h2>
      <div className="grid gap-2">
        {orders.map((o) => (
          <p key={o.id} className="rounded-xl border border-border bg-card p-3 text-sm">
            {o.number} · {o.user.email} · {o.status} · {formatGbp(o.totalPence)}
            {o.vendorOrders.map((vendorOrder) => (
              <span key={vendorOrder.id} className="mt-1 block text-muted">
                Products {formatGbp(vendorOrder.subtotalPence)} · Shipping {formatGbp(vendorOrder.shippingPence)} · Commission {formatGbp(vendorOrder.commissionPence)} · Vendor {formatGbp(vendorOrder.vendorNetPence)}
              </span>
            ))}
          </p>
        ))}
      </div>
    </>
  );
}
