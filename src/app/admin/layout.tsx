import { DashboardShell } from "@/components/dashboard-shell";
import { requirePermission } from "@/lib/auth";
import { ADMIN_NAV } from "@/lib/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("admin.dashboard.view");
  return (
    <DashboardShell title="Admin" items={ADMIN_NAV}>
      {children}
    </DashboardShell>
  );
}
