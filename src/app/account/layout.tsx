import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/auth";
import { CUSTOMER_NAV } from "@/lib/nav";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <DashboardShell title="Customer" items={CUSTOMER_NAV}>
      {children}
      <form action={logoutAction} className="mt-8 lg:hidden">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </DashboardShell>
  );
}
