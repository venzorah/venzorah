import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { coveredCommissionBps } from "@/lib/allocation";
import { getActivePlanForVendor, vendorHasChosenPlan } from "@/lib/commerce";
import { subscribePlan } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

function planPeriod(interval: string) {
  if (interval === "MONTH") return "per month";
  if (interval === "SIX_MONTH") return "every 6 months";
  if (interval === "YEAR") return "per year";
  return "no renewal";
}

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ choose?: string }>;
}) {
  const user = await requirePermission("vendor.subscription.manage");
  const query = await searchParams;
  const [plan, plans, sub, chosen] = await Promise.all([
    getActivePlanForVendor(user.vendorId!),
    prisma.subscriptionPlan.findMany({ where: { openForSignup: true }, orderBy: { sortOrder: "asc" } }),
    prisma.vendorSubscription.findFirst({
      where: { vendorId: user.vendorId!, status: { in: ["ACTIVE", "GRACE"] } },
      orderBy: { createdAt: "desc" },
    }),
    vendorHasChosenPlan(user.vendorId!),
  ]);
  const mustChoose = query.choose === "1" || !chosen;
  const monthly = plans.find((item) => item.interval === "MONTH" && item.pricePence > 0);

  return (
    <>
      <PageHeader
        title={mustChoose ? "Choose a plan to start listing" : "Subscription"}
        description={
          mustChoose
            ? "Pick Free or a paid plan before your first product. You can upgrade or downgrade later. A downgrade keeps your oldest live listings and moves the rest to draft."
            : `You are on ${plan.name}. Upgrade for a lower commission, or downgrade when you need fewer live listings.`
        }
      />
      {sub && chosen ? (
        <p className="mb-6 rounded-3xl bg-navy px-5 py-4 text-sm text-white">
          Current plan <span className="font-bold text-gold">{plan.name}</span>
          {" · "}renews or ends {sub.currentPeriodEnd.toLocaleDateString("en-GB")}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((item) => {
          const current = chosen && item.id === plan.id;
          const featured = item.key === "annual";
          const movingUp = chosen && item.pricePence > plan.pricePence;
          const movingDown = chosen && item.pricePence < plan.pricePence;
          const months = item.interval === "YEAR" ? 12 : item.interval === "SIX_MONTH" ? 6 : item.interval === "MONTH" ? 1 : 0;
          const perMonth = months > 1 ? Math.round(item.pricePence / months) : null;
          const saving = monthly && months > 1 ? monthly.pricePence * months - item.pricePence : 0;
          const muted = featured ? "text-white/70" : "text-muted";
          const label = current
            ? "Your plan"
            : movingUp
              ? `Upgrade to ${item.name}`
              : movingDown
                ? `Downgrade to ${item.name}`
                : item.pricePence === 0
                  ? "Start free"
                  : `Choose ${item.name}`;
          const variant = current ? "secondary" : movingDown ? "secondary" : featured || movingUp ? "primary" : "navy";
          return (
            <section
              key={item.id}
              className={
                featured
                  ? "relative flex flex-col rounded-3xl bg-navy-deep p-6 text-white shadow-sm"
                  : current
                    ? "relative flex flex-col rounded-3xl bg-card p-6 text-ink shadow-sm ring-2 ring-gold"
                    : "relative flex flex-col rounded-3xl bg-card p-6 text-ink shadow-sm ring-1 ring-border"
              }
            >
              <header className="flex min-h-7 items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">{item.name}</h2>
                {current ? (
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy">Current plan</span>
                ) : featured ? (
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy">Best value</span>
                ) : null}
              </header>
              <p className={`mt-1 text-sm ${muted}`}>{planPeriod(item.interval)}</p>
              <p className="mt-5 text-4xl font-extrabold leading-none tracking-tight">{formatGbp(item.pricePence)}</p>
              <p className={`mt-2 min-h-5 text-sm ${muted}`}>
                {perMonth != null ? (
                  <>
                    {formatGbp(perMonth)} a month
                    {saving > 0 ? <span className="font-bold text-gold"> · save {formatGbp(saving)}</span> : null}
                  </>
                ) : item.pricePence === 0 ? (
                  "Pay only when you sell"
                ) : (
                  "Renews each month"
                )}
              </p>
              <dl className={`mt-6 grid grid-cols-2 gap-3 border-t pt-5 ${featured ? "border-white/15" : "border-border"}`}>
                <div>
                  <dt className={`text-xs font-semibold ${muted}`}>Commission</dt>
                  <dd className="mt-1 text-xl font-extrabold">{coveredCommissionBps(item) / 100}%</dd>
                </div>
                <div>
                  <dt className={`text-xs font-semibold ${muted}`}>Live listings</dt>
                  <dd className="mt-1 text-xl font-extrabold">{item.maxActiveProducts == null ? "Unlimited" : item.maxActiveProducts}</dd>
                </div>
              </dl>
              <form
                action={async () => {
                  "use server";
                  await subscribePlan(item.id);
                }}
                className="mt-auto pt-6"
              >
                {movingDown ? (
                  <p className={`mb-3 rounded-xl px-3 py-2.5 text-xs leading-relaxed ${featured ? "bg-white/10" : "bg-surface"}`}>
                    Oldest live listings stay published. Newer ones move to draft. Nothing is deleted.
                  </p>
                ) : null}
                <Button type="submit" className="w-full rounded-full" variant={variant} disabled={current}>
                  {label}
                </Button>
              </form>
            </section>
          );
        })}
      </div>
      <p className="mt-5 text-center text-sm text-muted">
        Downgrading never deletes a product. Your oldest live listings stay published and any extras become drafts.
      </p>
    </>
  );
}
