import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { StatCard } from "@/components/stat-card";
import { formatGbp } from "@/lib/money";

export default async function AccountHome() {
  const user = await requireUser();
  const [orders, wishlist, notifications, reviews, returns] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, take: 5 }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.dispute.count({
      where: { vendorOrder: { order: { userId: user.id } }, status: { in: ["OPEN", "INVESTIGATING"] } },
    }),
  ]);
  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your orders, saved items and account tools in one place."
        action={
          <Link href="/products" className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
            Continue shopping
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wishlist" value={wishlist} hint="Saved for later" accent="gold" />
        <StatCard label="Unread" value={notifications} hint="Notifications" accent="info" />
        <StatCard label="Reviews" value={reviews} hint="Shared with vendors" accent="navy" />
        <StatCard label="Open returns" value={returns} hint="Needs attention" accent={returns ? "gold" : "success"} />
      </div>
      <div className="mt-8 flex items-end justify-between">
        <h2 className="text-lg font-bold text-ink">Recent orders</h2>
        <Link href="/account/orders" className="text-sm font-semibold text-muted hover:text-ink">
          View all
        </Link>
      </div>
      {orders.length ? (
        <div className="mt-3 grid gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition hover:ring-gold"
            >
              <div>
                <p className="font-semibold text-ink">{o.number}</p>
                <p className="text-xs text-muted">{formatGbp(o.totalPence)}</p>
              </div>
              <Badge tone={o.status === "PAID" || o.status === "DELIVERED" ? "success" : "navy"}>{o.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState title="No orders yet">
            <Link href="/products" className="mt-2 inline-block font-semibold text-ink underline">
              Browse the marketplace
            </Link>
          </EmptyState>
        </div>
      )}
    </>
  );
}
