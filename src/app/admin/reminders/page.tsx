import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminSaveReminder } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";

export default async function RemindersPage() {
  await requirePermission("admin.subscription.manage");
  const rules = await prisma.reminderRule.findMany();
  return (
    <>
      <PageHeader title="Subscription reminders" description="Offsets are days (negative = before the event). Weeks are entered as 7-day multiples." />
      <ul className="grid gap-2">
        {rules.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-card p-3">
            {r.name} · {r.eventType} · {r.offsetDays} days · {r.enabled ? "on" : "off"}
          </li>
        ))}
      </ul>
      <ActionForm action={adminSaveReminder} className="mt-6 grid max-w-lg gap-3">
        <Field label="Name">
          <Input name="name" required />
        </Field>
        <Field label="Event">
          <select name="eventType" className="tap-target rounded-xl border px-3">
            <option>RENEWAL</option>
            <option>EXPIRY</option>
            <option>FAILED_PAYMENT</option>
            <option>GRACE</option>
          </select>
        </Field>
        <Field label="Offset days">
          <Input name="offsetDays" type="number" defaultValue={-7} />
        </Field>
        <Button type="submit">Add rule</Button>
      </ActionForm>
    </>
  );
}
