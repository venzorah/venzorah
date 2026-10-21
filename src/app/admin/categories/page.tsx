import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminAddCategoryAttribute, adminSaveCategory } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea } from "@/components/ui";

export default async function AdminCategoriesPage() {
  await requirePermission("admin.category.manage");
  const categories = await prisma.category.findMany({
    include: { attributes: true, children: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <PageHeader title="Categories" description="Add, rename, reorder and attach attributes without code changes." />
      <ActionForm action={adminSaveCategory} className="grid max-w-lg gap-3 rounded-2xl border border-border bg-card p-4">
        <Field label="Name">
          <Input name="name" required />
        </Field>
        <Field label="Description">
          <Textarea name="description" />
        </Field>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked /> Enabled
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="featured" /> Featured
        </label>
        <Button type="submit">Create category</Button>
      </ActionForm>
      <div className="mt-8 grid gap-4">
        {categories.map((c) => (
          <section key={c.id} className="rounded-2xl border border-border bg-card p-4">
            <ActionForm action={adminSaveCategory} className="grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={c.id} />
              <Input name="name" defaultValue={c.name} />
              <Input name="sortOrder" type="number" defaultValue={c.sortOrder} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="enabled" defaultChecked={c.enabled} /> Enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="featured" defaultChecked={c.featured} /> Featured
              </label>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </ActionForm>
            <ActionForm action={adminAddCategoryAttribute} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="categoryId" value={c.id} />
              <Input name="key" placeholder="key" />
              <Input name="label" placeholder="label" />
              <Input name="fieldType" defaultValue="text" />
              <Button type="submit" variant="ghost">
                Add field
              </Button>
            </ActionForm>
            <p className="mt-2 text-xs text-muted">
              Fields: {c.attributes.map((a) => a.label).join(", ") || "none"}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
