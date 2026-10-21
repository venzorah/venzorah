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
      <PageHeader title="Earnings ledger" description="This is an auditable ledger, not an editable wallet. Settlement is not legal escrow." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>Pending {formatGbp(balances.pendingPence)}</Card>
        <Card>Available {formatGbp(balances.availablePence)}</Card>
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
