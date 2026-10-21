import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { getActivePlanForVendor } from "@/lib/commerce";
import { subscribePlan } from "@/app/actions/marketplace";
import { Button, PageHeader, Card } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function SubscriptionPage() {
  const user = await requirePermission("vendor.subscription.manage");
  const [plan, plans, sub] = await Promise.all([
    getActivePlanForVendor(user.vendorId!),
    prisma.subscriptionPlan.findMany({ where: { openForSignup: true }, orderBy: { sortOrder: "asc" } }),
    prisma.vendorSubscription.findFirst({
      where: { vendorId: user.vendorId!, status: { in: ["ACTIVE", "GRACE"] } },
      include: { billingEvents: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <>
      <PageHeader title="Subscription" description={`Current plan: ${plan.name}. Monthly paid plans debit on renewal when authorised.`} />
      {sub ? (
        <Card>
          Next period end {sub.currentPeriodEnd.toLocaleDateString("en-GB")} · Auto renew {String(sub.cancelAtPeriodEnd === false)}
        </Card>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {plans.map((p) => (
          <section key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-bold">{p.name}</h2>
            <p>{formatGbp(p.pricePence)}</p>
            <p className="text-sm">Commission {p.commissionBps / 100}%</p>
            <p className="text-sm">
              Listings {p.maxActiveProducts ?? "Unlimited"}
            </p>
            <form
              action={async () => {
                "use server";
                await subscribePlan(p.id);
              }}
            >
              <Button type="submit" className="mt-3">
                Choose plan
              </Button>
            </form>
          </section>
        ))}
      </div>
    </>
  );
}
