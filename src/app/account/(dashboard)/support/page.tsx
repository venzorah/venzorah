import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createTicket } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea } from "@/components/ui";

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await prisma.supportTicket.findMany({
    where: { requesterId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Support" />
      <ActionForm action={createTicket} className="grid max-w-lg gap-3">
        <Field label="Category">
          <select name="category" className="tap-target rounded-xl border border-border px-3">
            <option>GENERAL</option>
            <option>ORDER</option>
            <option>PAYMENTS</option>
            <option>PRIVACY</option>
          </select>
        </Field>
        <Field label="Subject">
          <Input name="subject" required />
        </Field>
        <Field label="Message">
          <Textarea name="body" required />
        </Field>
        <Button type="submit">Open ticket</Button>
      </ActionForm>
      <ul className="mt-8 grid gap-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link href={`/account/support/${t.id}`} className="font-semibold">
              {t.number} — {t.subject}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
