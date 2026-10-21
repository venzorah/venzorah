import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminSaveCms } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea } from "@/components/ui";

export default async function AdminCmsPage() {
  await requirePermission("admin.cms.manage");
  const pages = await prisma.cmsPage.findMany();
  return (
    <>
      <PageHeader title="Content" />
      {pages.map((p) => (
        <ActionForm key={p.id} action={adminSaveCms} className="mb-6 grid gap-2 rounded-2xl border border-border bg-card p-4">
          <input type="hidden" name="slug" value={p.slug} />
          <Field label="Title">
            <Input name="title" defaultValue={p.title} />
          </Field>
          <Field label="Body">
            <Textarea name="body" defaultValue={p.body} />
          </Field>
          <Button type="submit">Publish</Button>
        </ActionForm>
      ))}
    </>
  );
}
