import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { vendorBalances, getActivePlanForVendor, countActiveListings } from "@/lib/commerce";
import { formatGbp } from "@/lib/money";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { StatCard } from "@/components/stat-card";

export default async function VendorHome() {
  const user = await requirePermission("vendor.store.manage");
  const vendorId = user.vendorId;
  if (!vendorId) {
    return <VendorHomeEmpty name={user.name} />;
  }
  try {
    return await VendorHomeLive(vendorId);
  } catch (error) {
    console.error("[vendor] dashboard data unavailable", error instanceof Error ? error.message : error);
    return <VendorHomeEmpty name={user.name} />;
  }
}

function VendorHomeEmpty({ name }: { name: string }) {
  return (
    <>
      <PageHeader title={name} description="Your store tools are ready. Orders and payouts appear once the live database is connected." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live listings" value={0} hint="Published products" accent="navy" />
        <StatCard label="Pending" value={formatGbp(0)} hint="Awaiting delivery" accent="gold" />
        <StatCard label="Available" value={formatGbp(0)} hint="Ready to withdraw" accent="success" />
        <StatCard label="Held" value={formatGbp(0)} hint="In dispute or review" accent="info" />
      </div>
      <div className="mt-8">
        <EmptyState title="No vendor orders yet" />
      </div>
    </>
  );
}

async function VendorHomeLive(vendorId: string) {
  const [plan, listings, orders, balances, vendor] = await Promise.all([
    getActivePlanForVendor(vendorId),
    countActiveListings(vendorId),
    prisma.vendorOrder.findMany({
      where: { vendorId },
      orderBy: { order: { placedAt: "desc" } },
      include: { order: true },
      take: 8,
    }),
    vendorBalances(vendorId),
    prisma.vendorProfile.findUniqueOrThrow({ where: { id: vendorId } }),
  ]);
  return (
    <>
      <PageHeader
        title={vendor.storeName}
        description={`KYC ${vendor.kycStatus} · ${plan.name} plan`}
        action={
          <Link href="/vendor/products/new" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy">
            Add a product
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Live listings"
          value={plan.maxActiveProducts != null ? `${listings} / ${plan.maxActiveProducts}` : listings}
          hint="Published products"
          accent="navy"
        />
        <StatCard label="Pending" value={formatGbp(balances.pendingPence)} hint="Awaiting delivery" accent="gold" />
        <StatCard label="Available" value={formatGbp(balances.availablePence)} hint="Ready to withdraw" accent="success" />
        <StatCard label="Held" value={formatGbp(balances.heldPence)} hint="In dispute or review" accent="info" />
      </div>
      <div className="mt-8 flex items-end justify-between">
        <h2 className="text-lg font-bold text-ink">Recent orders</h2>
        <Link href="/vendor/orders" className="text-sm font-semibold text-muted hover:text-ink">
          View all
        </Link>
      </div>
      {orders.length ? (
        <div className="mt-3 grid gap-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/vendor/orders/${o.id}`}
              className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:ring-gold"
            >
              <div>
                <p className="font-semibold text-ink">{o.order.number}</p>
                <p className="text-xs text-muted">{formatGbp(o.vendorNetPence)}</p>
              </div>
              <Badge>{o.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState title="No vendor orders yet" />
        </div>
      )}
    </>
  );
}
