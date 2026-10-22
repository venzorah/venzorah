import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { requestPayoutAction, saveVendorBankAction } from "@/app/actions/marketplace";
import { vendorBalances } from "@/lib/commerce";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";
import { maskAccount } from "@/lib/wallet";

export default async function PayoutsPage() {
  const user = await requirePermission("vendor.payout.request");
  const [balances, requests, method] = await Promise.all([
    vendorBalances(user.vendorId!),
    prisma.withdrawalRequest.findMany({ where: { vendorId: user.vendorId! }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.payoutMethod.findFirst({ where: { vendorId: user.vendorId! }, orderBy: { isDefault: "desc" } }),
  ]);
  return (
    <>
      <PageHeader
        title="Wallet"
        description="Each paid order puts your share in this wallet. It can be withdrawn after 7 days with no open complaint. A withdrawal to your saved account is paid out immediately."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <section className="rounded-3xl bg-navy p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Ready to withdraw</p>
          <p className="mt-2 text-3xl font-extrabold">{formatGbp(balances.availablePence)}</p>
        </section>
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Held for 7 days</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{formatGbp(balances.pendingPence)}</p>
        </section>
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Withdrawn</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{formatGbp(balances.withdrawnPence)}</p>
        </section>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Shipping you charged stays in your share. An open return or complaint keeps that order locked. Once the 7 days are clear, withdrawing moves the money to the account you saved.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ActionForm action={saveVendorBankAction} className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-border" successMessage="Payout account saved.">
          <h2 className="text-lg font-bold text-ink">Payout account</h2>
          <p className="text-sm text-muted">{method ? `${method.label} · ${maskAccount(method.details)}` : "Add a UK account before you withdraw."}</p>
          <Field label="Account name">
            <Input name="accountName" defaultValue={method?.label ?? ""} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sort code">
              <Input name="sortCode" inputMode="numeric" placeholder="20-00-00" required />
            </Field>
            <Field label="Account number">
              <Input name="accountNumber" inputMode="numeric" placeholder="12345678" autoComplete="off" required />
            </Field>
          </div>
          <Button type="submit" variant="secondary">Save account</Button>
        </ActionForm>

        <ActionForm action={requestPayoutAction} className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-border" successMessage="Withdrawal paid to your saved account.">
          <h2 className="text-lg font-bold text-ink">Withdraw</h2>
          <Field label="Amount GBP">
            <Input name="amount" inputMode="decimal" placeholder="10.00" required />
          </Field>
          <Button type="submit">Withdraw available balance</Button>
        </ActionForm>
      </div>

      <h2 className="mt-8 text-lg font-bold text-ink">Withdrawals</h2>
      <ul className="mt-3 grid gap-2 text-sm">
        {requests.map((request) => (
          <li key={request.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <span className="font-semibold text-ink">{request.status}</span>
            <span className="text-muted"> · {formatGbp(request.amountPence)}</span>
            {request.reason ? <span className="text-muted"> · {request.reason}</span> : null}
          </li>
        ))}
      </ul>
    </>
  );
}
