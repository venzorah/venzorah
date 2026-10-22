import Link from "next/link";
import { SignInToCheckout } from "@/components/sign-in-to-checkout";
import { DemoStripeForm } from "@/components/demo-stripe-form";
import { PageHeader } from "@/components/ui";
import { checkoutActor } from "@/lib/checkout-actor";
import { readCheckoutDraft } from "@/lib/checkout-draft";
import { formatGbp } from "@/lib/money";

export default async function DemoStripePage() {
  const user = await checkoutActor();
  if (!user) return <SignInToCheckout />;
  const draft = await readCheckoutDraft();
  if (!draft || draft.userId !== user.id) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <PageHeader title="Checkout expired" description="Start again from your cart. Nothing has been charged." />
        <Link href="/cart" className="font-semibold text-ink underline">
          Back to cart
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <PageHeader
        title="Pay with demo Stripe"
        description={`${draft.shippingName} · ${draft.shippingCity}${draft.shippingRegion ? `, ${draft.shippingRegion}` : ""} ${draft.shippingPostcode}`}
      />
      <div className="mb-4 grid gap-1 text-sm">
        {draft.lines.map((line) => (
          <p key={`${line.name}-${line.quantity}-${line.unitPence}`}>
            {line.name} × {line.quantity}
          </p>
        ))}
        <p>Items {formatGbp(draft.subtotalPence)}</p>
        <p>Shipping {formatGbp(draft.shippingPence)}</p>
        {draft.taxPence ? <p>VAT {formatGbp(draft.taxPence)}</p> : null}
        <p className="font-bold">Total {formatGbp(draft.totalPence)}</p>
      </div>
      <DemoStripeForm totalPence={draft.totalPence} />
    </main>
  );
}
