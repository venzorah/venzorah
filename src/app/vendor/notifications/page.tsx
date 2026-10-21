import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export default async function VendorNotificationsPage() {
  const user = await requirePermission("vendor.store.manage");
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Notifications" />
      <ul className="grid gap-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm">{n.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
