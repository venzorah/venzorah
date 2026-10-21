import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
  return (
    <>
      <PageHeader title="Profile" />
      <ActionForm action={updateProfile} className="grid max-w-lg gap-3">
        <Field label="Name">
          <Input name="name" defaultValue={user.name} />
        </Field>
        <Field label="Phone">
          <Input name="phone" defaultValue={user.phone ?? ""} type="tel" />
        </Field>
        <Field label="Email" hint="Email changes require verification. Contact support to update.">
          <Input defaultValue={user.email} disabled />
        </Field>
        <Button type="submit">Save profile</Button>
      </ActionForm>
    </>
  );
}
