import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { DashboardHero } from "@/components/dashboard-hero";
import { StatCard } from "@/components/stat-card";
import { formatGbp } from "@/lib/money";

export default async function AdminHome() {
  await requirePermission("admin.dashboard.view");
  try {
    return await AdminHomeLive();
  } catch (error) {
    console.error("[admin] dashboard data unavailable", error instanceof Error ? error.message : error);
    return <AdminHomeEmpty />;
  }
}

function AdminHomeEmpty() {
  return (
    <>
      <DashboardHero
        eyebrow="Admin"
        title="Marketplace control centre"
        description="You are signed in. Sales, vendors and payouts appear once the live database is connected."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={0} hint="Waiting for the database" accent="navy" />
        <StatCard label="Vendors" value={0} hint="Waiting for the database" accent="gold" />
        <StatCard label="Live products" value={0} hint="Catalogue is still shown in the shop" accent="info" />
        <StatCard label="Orders" value={0} hint="None stored yet" accent="success" />
      </div>
    </>
  );
}

async function AdminHomeLive() {
  const [
    customers,
    suspendedCustomers,
    vendors,
    verifiedVendors,
    products,
    pendingProducts,
    orders,
    pendingOrders,
    fulfilled,
    cancelled,
    refunds,
    sales,
    commission,
    pendingWithdrawals,
    disputes,
    recentUsers,
    audits,
  ] = await Promise.all([
    prisma.customerProfile.count(),
    prisma.user.count({ where: { customer: { isNot: null }, status: "SUSPENDED" } }),
    prisma.vendorProfile.count(),
    prisma.vendorProfile.count({ where: { kycStatus: "APPROVED" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PAID", "PENDING_PAYMENT"] } } }),
    prisma.vendorOrder.count({ where: { status: { in: ["DELIVERED", "SETTLED"] } } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.refund.count(),
    prisma.order.aggregate({ _sum: { totalPence: true }, where: { paymentStatus: "PAID" } }),
    prisma.vendorOrder.aggregate({ _sum: { commissionPence: true } }),
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const plans = await prisma.subscriptionPlan.findMany({
    include: { _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } } },
  });

  return (
    <>
      <DashboardHero
        eyebrow="Admin"
        title="Marketplace control centre"
        description="Sales, commission, vendors and payouts at a glance."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={customers} hint={`${suspendedCustomers} suspended`} accent="navy" />
        <StatCard label="Vendors" value={vendors} hint={`${verifiedVendors} verified`} accent="gold" />
        <StatCard label="Live products" value={products} hint={`${pendingProducts} awaiting review`} accent="info" />
        <StatCard label="Orders" value={orders} hint={`${pendingOrders} open or paid`} accent="success" />
        <StatCard label="Gross sales" value={formatGbp(sales._sum.totalPence ?? 0)} hint="Paid orders" accent="navy" />
        <StatCard label="Commission" value={formatGbp(commission._sum.commissionPence ?? 0)} hint="Platform share" accent="gold" />
        <StatCard label="Withdrawals" value={pendingWithdrawals} hint="Pending approval" accent="info" />
        <StatCard
          label="Disputes"
          value={disputes}
          hint={`${cancelled} cancelled · ${refunds} refunds · ${fulfilled} fulfilled`}
          accent={disputes ? "gold" : "success"}
        />
      </div>
      <section className="mt-8 rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="text-lg font-bold text-ink">Needs review</h2>
        <ul className="mt-3 divide-y divide-border">
          {[
            { href: "/admin/products", label: "Products awaiting review", count: pendingProducts },
            { href: "/admin/payouts", label: "Withdrawals to approve", count: pendingWithdrawals },
            { href: "/admin/orders", label: "Open disputes", count: disputes },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold text-ink">{item.label}</span>
                <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-navy">{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <h2 className="mt-8 mb-3 text-lg font-bold text-ink">Active subscriptions</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <StatCard key={p.id} label={p.name} value={p._count.subscriptions} hint="Active" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Recent registrations</h2>
          <ul className="grid gap-2">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm shadow-sm ring-1 ring-border">
                <span className="font-semibold text-ink">{u.name}</span>
                <span className="text-muted">{u.email}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">Administrative activity</h2>
          <ul className="grid gap-2">
            {audits.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm shadow-sm ring-1 ring-border">
                <span className="font-medium text-ink">{a.action}</span>
                <Badge tone="muted">{a.entity}</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
