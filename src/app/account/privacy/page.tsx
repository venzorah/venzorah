import { requestPrivacyAction } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, PageHeader, Textarea } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy requests"
        description="Account restrictions never remove access to legally required records, active orders, refunds or privacy rights."
      />
      <ActionForm action={requestPrivacyAction} className="grid max-w-lg gap-3">
        <Field label="Request type">
          <select name="type" className="tap-target rounded-xl border border-border px-3">
            <option value="DATA_EXPORT">Export my data</option>
            <option value="ACCOUNT_DELETION">Delete my account</option>
          </select>
        </Field>
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
        <Button type="submit">Submit request</Button>
      </ActionForm>
    </>
  );
}
