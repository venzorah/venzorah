import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { adminSaveSetting } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";

export default async function SettingsPage() {
  await requirePermission("admin.settings.manage");
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Platform settings" description="Every change is audited with previous and new values." />
      <div className="grid gap-3">
        {Object.entries(settings).map(([key, value]) => (
          <ActionForm key={key} action={adminSaveSetting} className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
            <input type="hidden" name="key" value={key} />
            <Field label={key}>
              <Input name="value" defaultValue={value} />
            </Field>
            <Button type="submit" variant="secondary">
              Save
            </Button>
          </ActionForm>
        ))}
      </div>
    </>
  );
}
