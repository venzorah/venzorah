import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export default async function InquiriesPage() {
  const user = await requirePermission("vendor.order.manage");
  const tickets = await prisma.supportTicket.findMany({
    where: { category: "ORDER", requester: { orders: { some: { vendorOrders: { some: { vendorId: user.vendorId! } } } } } },
    include: { requester: true },
  });
  return (
    <>
      <PageHeader title="Order inquiries" />
      <ul className="grid gap-3">
        {tickets.map((t) => (
          <li key={t.id} className="rounded-2xl border border-border bg-card p-4">
            {t.number} · {t.subject} · {t.requester.name}
          </li>
        ))}
      </ul>
    </>
  );
}
