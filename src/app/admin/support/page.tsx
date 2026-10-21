import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminReplyTicket } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, PageHeader, Textarea } from "@/components/ui";

export default async function AdminSupportPage() {
  await requirePermission("admin.support.manage");
  const tickets = await prisma.supportTicket.findMany({
    include: { requester: true, messages: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Support tickets" />
      <div className="grid gap-4">
        {tickets.map((t) => (
          <section key={t.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">
              {t.number} · {t.subject} · {t.requester.email}
            </p>
            {t.messages.map((m) => (
              <p key={m.id} className="text-sm">
                {m.internal ? "[staff] " : ""}
                {m.body}
              </p>
            ))}
            <ActionForm action={adminReplyTicket} className="mt-3 grid gap-2">
              <input type="hidden" name="ticketId" value={t.id} />
              <Textarea name="body" />
              <label className="text-sm">
                <input type="checkbox" name="internal" /> Internal note
              </label>
              <Button type="submit">Reply</Button>
            </ActionForm>
          </section>
        ))}
      </div>
    </>
  );
}
