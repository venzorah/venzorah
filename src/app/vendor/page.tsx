import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { vendorBalances, getActivePlanForVendor, countActiveListings } from "@/lib/commerce";
import { formatGbp } from "@/lib/money";
import { Badge, EmptyState } from "@/components/ui";
import { DashboardHero } from "@/components/dashboard-hero";
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
      <DashboardHero
        eyebrow="Vendor"
        title={name}
        description="Your store tools are ready. Orders and payouts appear once the live database is connected."
      />
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
      <DashboardHero
        eyebrow="Vendor"
        title={vendor.storeName}
        description={`KYC ${vendor.kycStatus.toLowerCase().replaceAll("_", " ")} · ${plan.name} plan`}
        action={
          <Link href="/vendor/products/new" className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-navy">
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
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-bold text-ink">Recent orders</h2>
            <Link href="/vendor/orders" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              View all
            </Link>
          </div>
          {orders.length ? (
            <ul className="mt-3 divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/vendor/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold text-ink">{o.order.number}</p>
                      <p className="text-xs text-muted">{formatGbp(o.vendorNetPence)}</p>
                    </div>
                    <Badge>{o.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState title="No vendor orders yet" />
            </div>
          )}
        </section>
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-lg font-bold text-ink">Store status</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            <li>
              <p className="font-semibold text-ink">Plan</p>
              <p className="text-muted">
                {plan.name} · {plan.commissionBps / 100}% commission
              </p>
              <Link href="/vendor/subscription" className="text-xs font-bold text-ink underline-offset-4 hover:underline">
                Upgrade or downgrade
              </Link>
            </li>
            <li>
              <p className="font-semibold text-ink">KYC</p>
              <p className="text-muted">{vendor.kycStatus.toLowerCase().replaceAll("_", " ")}</p>
            </li>
            <li>
              <p className="font-semibold text-ink">Live listings</p>
              <p className="text-muted">
                {plan.maxActiveProducts != null ? `${listings} of ${plan.maxActiveProducts}` : `${listings} published`}
              </p>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
