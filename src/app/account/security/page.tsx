import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { changePassword } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { Button, Field, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function SecurityPage() {
  const user = await requireUser();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Security" />
      <ActionForm action={changePassword} className="grid max-w-lg gap-3">
        <Field label="New password">
          <PasswordInput name="password" minLength={10} required autoComplete="new-password" />
        </Field>
        <Button type="submit">Update password</Button>
      </ActionForm>
      <h2 className="mt-8 mb-3 font-bold">Active sessions</h2>
      <ul className="grid gap-2 text-sm">
        {sessions.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-card p-3">
            {formatDate(s.createdAt)} · {s.userAgent ?? "Unknown device"}
          </li>
        ))}
      </ul>
    </>
  );
}
