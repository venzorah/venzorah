import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { replyTicket } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, PageHeader, Textarea } from "@/components/ui";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, requesterId: user.id },
    include: { messages: true },
  });
  if (!ticket) notFound();
  return (
    <>
      <PageHeader title={ticket.subject} description={ticket.number} />
      <div className="grid gap-3">
        {ticket.messages
          .filter((m) => !m.internal)
          .map((m) => (
            <article key={m.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              {m.body}
            </article>
          ))}
      </div>
      <ActionForm action={replyTicket} className="mt-6 grid gap-3">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <Textarea name="body" required />
        <Button type="submit">Reply</Button>
      </ActionForm>
    </>
  );
}
