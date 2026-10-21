import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminSavePlan } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";

export default async function AdminPlansPage() {
  await requirePermission("admin.subscription.manage");
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Subscription plans" description="Prices, commissions and listing limits are administrator-controlled." />
      <div className="grid gap-4">
        {plans.map((p) => (
          <ActionForm key={p.id} action={adminSavePlan} className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={p.id} />
            <Field label="Name">
              <Input name="name" defaultValue={p.name} />
            </Field>
            <Field label="Price GBP">
              <Input name="price" defaultValue={(p.pricePence / 100).toFixed(2)} />
            </Field>
            <Field label="Commission bps">
              <Input name="commissionBps" defaultValue={p.commissionBps} />
            </Field>
            <Field label="Max active products (blank = unlimited)">
              <Input name="maxActiveProducts" defaultValue={p.maxActiveProducts ?? ""} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="openForSignup" defaultChecked={p.openForSignup} /> Open for signup
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="autoRenew" defaultChecked={p.autoRenew} /> Auto renew
            </label>
            <Button type="submit">Save plan</Button>
          </ActionForm>
        ))}
      </div>
    </>
  );
}
