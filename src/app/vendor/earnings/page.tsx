import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { vendorBalances } from "@/lib/commerce";
import { formatGbp } from "@/lib/money";
import { Card, PageHeader } from "@/components/ui";

export default async function EarningsPage() {
  const user = await requirePermission("vendor.payout.request");
  const [balances, entries] = await Promise.all([
    vendorBalances(user.vendorId!),
    prisma.ledgerEntry.findMany({ where: { vendorId: user.vendorId! }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  return (
    <>
      <PageHeader title="Earnings ledger" description="Product commission and shipping are recorded separately. Shipping fees are yours in full. Funds stay on hold for the escrow window." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>Product proceeds {formatGbp(balances.productProceedsPence)}</Card>
        <Card>Shipping collected {formatGbp(balances.shippingPence)}</Card>
        <Card>Platform commission {formatGbp(balances.commissionPence)}</Card>
        <Card>Pending escrow {formatGbp(balances.pendingPence)}</Card>
        <Card>Available {formatGbp(balances.availablePence)}</Card>
        <Card>Paid out {formatGbp(balances.withdrawnPence)}</Card>
        <Card>Refunds {formatGbp(balances.refundsPence)}</Card>
        <Card>Held {formatGbp(balances.heldPence)}</Card>
      </div>
      <ul className="mt-6 grid gap-2 text-sm">
        {entries.map((e) => (
          <li key={e.id} className="rounded-xl border border-border bg-card p-3">
            {e.type} · {formatGbp(e.amountPence)} · {e.note}
          </li>
        ))}
      </ul>
    </>
  );
}
