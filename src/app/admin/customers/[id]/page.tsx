import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminSetUserStatus } from "@/app/actions/marketplace";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.customer.manage");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { orders: true, restrictionEvents: true, auditLogs: { take: 10, orderBy: { createdAt: "desc" } } },
  });
  if (!user) notFound();
  const spent = user.orders.reduce((s, o) => s + o.totalPence, 0);
  return (
    <>
      <PageHeader title={user.name} description={user.email} />
      <p>Status {user.status} · Spent {formatGbp(spent)}</p>
      <p className="text-sm text-muted">Passwords and card data are never shown.</p>
      <form
        className="mt-6 grid max-w-md gap-3"
        action={async (fd) => {
          "use server";
          await adminSetUserStatus(user.id, String(fd.get("status")), String(fd.get("reason")));
        }}
      >
        <Field label="Status">
          <select name="status" defaultValue={user.status} className="tap-target rounded-xl border px-3">
            <option>ACTIVE</option>
            <option>SUSPENDED</option>
          </select>
        </Field>
        <Field label="Reason">
          <Input name="reason" required />
        </Field>
        <Button type="submit">Apply</Button>
      </form>
    </>
  );
}
