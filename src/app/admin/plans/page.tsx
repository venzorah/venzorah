import { prisma } from "@/lib/db";
import { adminCreatePlan, adminDeletePlan, adminSavePlan } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";

export default async function AdminPlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader
        title="Subscription plans"
        description="Add a plan, change its price and listing limit, or remove a plan that no vendor is using."
      />
      <ActionForm action={adminCreatePlan} className="mb-6 grid gap-3 rounded-3xl bg-navy p-6 text-white sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">New plan</p>
          <h2 className="mt-1 text-xl font-extrabold">Add a plan</h2>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-white/80">Name</span>
          <Input name="name" required className="bg-white text-ink" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-white/80">Price GBP</span>
          <Input name="price" defaultValue="0.00" required className="bg-white text-ink" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-white/80">Commission basis points</span>
          <Input name="commissionBps" defaultValue="300" required className="bg-white text-ink" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-white/80">Max live listings</span>
          <Input name="maxActiveProducts" placeholder="Blank for unlimited" className="bg-white text-ink" />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-white/80">Billing interval</span>
          <select name="interval" defaultValue="MONTH" className="rounded-xl border border-border bg-white px-3 py-2 text-ink">
            <option value="NONE">No renewal</option>
            <option value="MONTH">Monthly</option>
            <option value="SIX_MONTH">6 months</option>
            <option value="YEAR">Yearly</option>
          </select>
        </label>
        <Button type="submit" className="rounded-full sm:col-span-2">
          Add plan
        </Button>
      </ActionForm>
      <div className="grid gap-4">
        {plans.map((plan) => (
          <section key={plan.id} className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
            <ActionForm action={adminSavePlan} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={plan.id} />
              <h2 className="sm:col-span-2 text-lg font-extrabold text-ink">{plan.name}</h2>
              <Field label="Name">
                <Input name="name" defaultValue={plan.name} />
              </Field>
              <Field label="Price GBP">
                <Input name="price" defaultValue={(plan.pricePence / 100).toFixed(2)} />
              </Field>
              <Field label="Commission basis points">
                <Input name="commissionBps" defaultValue={plan.commissionBps} />
              </Field>
              <Field label="Max live listings">
                <Input name="maxActiveProducts" defaultValue={plan.maxActiveProducts ?? ""} placeholder="Blank for unlimited" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="openForSignup" defaultChecked={plan.openForSignup} /> Open for vendors
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="autoRenew" defaultChecked={plan.autoRenew} /> Auto renew
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" className="rounded-full">
                  Save plan
                </Button>
              </div>
            </ActionForm>
            {plan.key === "free" ? (
              <p className="mt-3 text-sm text-muted">The Free plan stays available so vendors can downgrade.</p>
            ) : (
              <ActionForm action={adminDeletePlan} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <input type="hidden" name="id" value={plan.id} />
                <p className="text-sm text-muted">Remove {plan.name} when no vendor is currently on it.</p>
                <Button type="submit" variant="danger" className="rounded-full">
                  Remove plan
                </Button>
              </ActionForm>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
