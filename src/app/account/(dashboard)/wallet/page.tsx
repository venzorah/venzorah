import Link from "next/link";
import { fundWalletAction, requestBuyerPayoutAction, saveBuyerBankAction } from "@/app/actions/wallet";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatGbp } from "@/lib/money";
import { buyerWallet, maskAccount } from "@/lib/wallet";

const ENTRY_LABEL: Record<string, string> = {
  TOP_UP: "Added funds",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  PAYOUT: "Payout",
};

export default async function BuyerWalletPage() {
  const user = await requireUser();
  const wallet = await buyerWallet(user.id);
  return (
    <>
      <PageHeader
        title="Wallet"
        description="Add money, pay for orders, and receive refunds here. A payout to your saved account leaves the wallet straight away."
      />
      <section className="rounded-3xl bg-navy p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Available</p>
        <p className="mt-2 text-4xl font-extrabold">{formatGbp(wallet.balancePence)}</p>
        <p className="mt-2 max-w-lg text-sm text-white/75">
          Refunds from an order are added to this balance. You can spend it at checkout or send it to the bank account you save below.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ActionForm action={fundWalletAction} className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-border" successMessage="Funds added to your wallet.">
          <h2 className="text-lg font-bold text-ink">Add funds</h2>
          <p className="text-sm text-muted">Use the demonstration card 4242 4242 4242 4242. No real charge is made, and the card number is not stored.</p>
          <Field label="Amount GBP">
            <Input name="amount" inputMode="decimal" placeholder="20.00" required />
          </Field>
          <Field label="Card number">
            <Input name="cardNumber" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry">
              <Input name="cardExpiry" inputMode="numeric" placeholder="12/29" required />
            </Field>
            <Field label="CVC">
              <Input name="cardCvc" inputMode="numeric" autoComplete="off" placeholder="123" required />
            </Field>
          </div>
          <Button type="submit">Add to wallet</Button>
        </ActionForm>

        <div className="grid gap-6">
          <ActionForm action={saveBuyerBankAction} className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-border" successMessage="Payout account saved.">
            <h2 className="text-lg font-bold text-ink">Payout account</h2>
            <p className="text-sm text-muted">
              {wallet.detail
                ? `${wallet.detail.accountName} · ${wallet.detail.sortCode} · ${maskAccount(wallet.detail.accountNumber)}`
                : "Add a UK account so a payout has somewhere to go."}
            </p>
            <Field label="Account name">
              <Input name="accountName" defaultValue={wallet.detail?.accountName ?? ""} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sort code">
                <Input name="sortCode" inputMode="numeric" placeholder="20-00-00" defaultValue={wallet.detail?.sortCode ?? ""} required />
              </Field>
              <Field label="Account number">
                <Input name="accountNumber" inputMode="numeric" placeholder="12345678" autoComplete="off" required />
              </Field>
            </div>
            <Button type="submit" variant="secondary">Save account</Button>
          </ActionForm>

          <ActionForm action={requestBuyerPayoutAction} className="grid gap-3 rounded-3xl bg-card p-5 ring-1 ring-border" successMessage="Payout sent to your saved account.">
            <h2 className="text-lg font-bold text-ink">Withdraw</h2>
            <Field label="Amount GBP">
              <Input name="amount" inputMode="decimal" placeholder="10.00" required />
            </Field>
            <Button type="submit">Withdraw from wallet</Button>
          </ActionForm>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-ink">Activity</h2>
      {wallet.entries.length ? (
        <ul className="mt-3 grid gap-2 text-sm">
          {wallet.entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border">
              <span>
                <span className="font-semibold text-ink">{ENTRY_LABEL[entry.type] ?? entry.type}</span>
                {entry.note ? <span className="text-muted"> · {entry.note}</span> : null}
              </span>
              <span className="font-bold text-ink">
                {entry.type === "PURCHASE" || entry.type === "PAYOUT" ? "−" : "+"}
                {formatGbp(entry.amountPence)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          No wallet activity yet. <Link href="/products" className="font-semibold text-ink underline">Continue shopping</Link>
        </p>
      )}
    </>
  );
}
