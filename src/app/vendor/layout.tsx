import { DashboardShell } from "@/components/dashboard-shell";
import { requirePermission } from "@/lib/auth";
import { VENDOR_NAV } from "@/lib/nav";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("vendor.store.manage");
  return (
    <DashboardShell title="Vendor" items={VENDOR_NAV}>
      {children}
    </DashboardShell>
  );
}
