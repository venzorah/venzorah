import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requirePermission } from "@/lib/auth";
import { getActivePlanForVendor } from "@/lib/commerce";
import { VENDOR_NAV } from "@/lib/nav";
import { prisma } from "@/lib/db";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("vendor.store.manage");
  let footer: React.ReactNode = null;
  if (user.vendorId) {
    try {
      const [vendor, plan] = await Promise.all([
        prisma.vendorProfile.findUnique({ where: { id: user.vendorId }, select: { storeName: true } }),
        getActivePlanForVendor(user.vendorId),
      ]);
      footer = (
        <div className="rounded-2xl bg-navy-deep p-4">
          <p className="text-xs text-white/60">{vendor?.storeName ?? "Your store"}</p>
          <p className="mt-0.5 font-bold">{plan.name}</p>
          <p className="text-xs text-white/60">{plan.commissionBps / 100}% commission</p>
          <Link href="/vendor/subscription" className="mt-2 inline-block text-xs font-bold text-gold">
            Manage plan
          </Link>
        </div>
      );
    } catch (error) {
      console.error("[vendor] plan summary unavailable", error instanceof Error ? error.message : error);
    }
  }
  return (
    <DashboardShell title="Vendor" items={VENDOR_NAV} footer={footer}>
      {children}
    </DashboardShell>
  );
}
