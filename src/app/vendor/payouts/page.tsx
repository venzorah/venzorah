import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { requestPayoutAction } from "@/app/actions/marketplace";
import { vendorBalances } from "@/lib/commerce";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function PayoutsPage() {
  const user = await requirePermission("vendor.payout.request");
  const [balances, requests] = await Promise.all([
    vendorBalances(user.vendorId!),
    prisma.withdrawalRequest.findMany({ where: { vendorId: user.vendorId! }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <PageHeader title="Payouts" description={`Available ${formatGbp(balances.availablePence)}. Duplicate or oversize requests are rejected.`} />
      <ActionForm action={requestPayoutAction} className="grid max-w-md gap-3">
        <Field label="Amount GBP">
          <Input name="amount" required />
        </Field>
        <Button type="submit">Request withdrawal</Button>
      </ActionForm>
      <ul className="mt-6 grid gap-2 text-sm">
        {requests.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-card p-3">
            {r.status} · {formatGbp(r.amountPence)}
          </li>
        ))}
      </ul>
    </>
  );
}
