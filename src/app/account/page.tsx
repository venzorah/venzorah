import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, EmptyState } from "@/components/ui";
import { DashboardHero } from "@/components/dashboard-hero";
import { StatCard } from "@/components/stat-card";
import { formatGbp } from "@/lib/money";

export default async function AccountHome() {
  const user = await requireUser();
  let orders: { id: string; number: string; totalPence: number; status: string }[] = [];
  let wishlist = 0;
  let notifications = 0;
  let reviews = 0;
  let returns = 0;
  try {
    const [orderRows, wishlistCount, notificationCount, reviewCount, returnCount] = await Promise.all([
      prisma.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, take: 5 }),
      prisma.wishlistItem.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.dispute.count({
        where: { vendorOrder: { order: { userId: user.id } }, status: { in: ["OPEN", "INVESTIGATING"] } },
      }),
    ]);
    orders = orderRows;
    wishlist = wishlistCount;
    notifications = notificationCount;
    reviews = reviewCount;
    returns = returnCount;
  } catch (error) {
    console.error("[account] dashboard data unavailable", error instanceof Error ? error.message : error);
  }
  return (
    <>
      <DashboardHero
        eyebrow="Your account"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your orders, saved items and account tools in one place."
        action={
          <Link href="/products" className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-navy">
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
      {orders[0] ? (
        <Link
          href={`/account/orders/${orders[0].id}`}
          className="mt-6 flex items-center justify-between gap-3 rounded-3xl bg-card p-5 ring-1 ring-border"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Latest order</p>
            <p className="mt-1 font-bold text-ink">{orders[0].number}</p>
            <p className="text-sm text-muted">{formatGbp(orders[0].totalPence)}</p>
          </div>
          <Badge tone={orders[0].status === "PAID" || orders[0].status === "DELIVERED" ? "success" : "navy"}>
            {orders[0].status}
          </Badge>
        </Link>
      ) : null}
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
