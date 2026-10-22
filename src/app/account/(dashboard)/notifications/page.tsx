import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { markNotificationsRead } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader
        title="Notifications"
        action={
          <form action={markNotificationsRead}>
            <Button type="submit" variant="secondary">
              Mark all read
            </Button>
          </form>
        }
      />
      <div className="grid gap-3">
        {notes.map((n) => (
          <article key={n.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm">{n.body}</p>
            <p className="text-xs text-muted">{formatDate(n.createdAt)}</p>
          </article>
        ))}
      </div>
    </>
  );
}
