import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { checkoutActor } from "@/lib/checkout-actor";
import { readCheckoutReceipt } from "@/lib/checkout-draft";
import { formatGbp } from "@/lib/money";
import { SignInToCheckout } from "@/components/sign-in-to-checkout";

export default async function CheckoutCompletePage() {
  const user = await checkoutActor();
  if (!user) return <SignInToCheckout />;
  const receipt = await readCheckoutReceipt();
  if (!receipt) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <PageHeader title="No payment to show" description="Completed demo Stripe payments appear here." />
        <Link href="/products" className="font-semibold text-ink underline">
          Continue shopping
        </Link>
      </main>
    );
  }

  const taxPence =
    receipt.taxPence ?? Math.max(0, receipt.totalPence - receipt.subtotalPence - receipt.shippingPence);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <PageHeader
        title="Payment confirmed"
        description={`${receipt.number} was paid with demo Stripe. No real charge was made.`}
      />
      <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
        {receipt.lines.map((line) => (
          <p key={`${line.name}-${line.unitPence}`}>
            {line.name} × {line.quantity} — {formatGbp(line.unitPence * line.quantity)}
          </p>
        ))}
        <p>Items {formatGbp(receipt.subtotalPence)}</p>
        <p>Shipping {formatGbp(receipt.shippingPence)}</p>
        {taxPence ? <p>VAT {formatGbp(taxPence)}</p> : null}
        <p className="font-bold">Total {formatGbp(receipt.totalPence)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
        {receipt.orderId ? (
          <Link href={`/account/orders/${receipt.orderId}?paid=1`} className="underline">
            View order
          </Link>
        ) : null}
        <Link href="/products" className="underline">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
