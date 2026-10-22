import Link from "next/link";
import { updateCheckoutDelivery } from "@/app/actions/marketplace";
import { SignInToCheckout } from "@/components/sign-in-to-checkout";
import { DemoStripeForm } from "@/components/demo-stripe-form";
import { ActionForm } from "@/components/forms";
import { Button, PageHeader } from "@/components/ui";
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
      <div className="mb-4 grid gap-3 text-sm">
        {draft.lines.map((line) => (
          <p key={`${line.name}-${line.vendor}-${line.quantity}-${line.unitPence}`}>
            {line.name} × {line.quantity}
            <span className="text-muted"> · {line.vendor}</span>
          </p>
        ))}
        {draft.vendors?.length ? (
          <ActionForm action={updateCheckoutDelivery} className="grid gap-3">
            {draft.vendors.map((vendor) => (
              <fieldset key={vendor.vendorId} className="grid gap-2 rounded-2xl border border-border bg-card p-4">
                <legend className="px-1 font-bold">{vendor.name}</legend>
                <p>Products {formatGbp(vendor.productSubtotalPence)}</p>
                {vendor.discountPence ? <p>Discount −{formatGbp(vendor.discountPence)}</p> : null}
                <p>
                  Delivery {formatGbp(vendor.shippingPence)} · {vendor.shippingMethodName}
                </p>
                {vendor.methods.length > 1
                  ? vendor.methods.map((method) => (
                      <label key={method.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`method_${vendor.vendorId}`}
                          value={method.id}
                          defaultChecked={method.id === vendor.shippingMethodId}
                        />
                        {method.name} · {formatGbp(method.pricePence)}
                      </label>
                    ))
                  : null}
              </fieldset>
            ))}
            {draft.vendors.some((vendor) => vendor.methods.length > 1) ? (
              <Button type="submit" variant="secondary" className="rounded-full">
                Update delivery
              </Button>
            ) : null}
          </ActionForm>
        ) : null}
        <p>Items {formatGbp(draft.subtotalPence)}</p>
        <p>Shipping {formatGbp(draft.shippingPence)}</p>
        {draft.discountPence ? <p>Discount −{formatGbp(draft.discountPence)}</p> : null}
        {draft.taxPence ? <p>VAT {formatGbp(draft.taxPence)}</p> : null}
        <p className="font-bold">Total {formatGbp(draft.totalPence)}</p>
      </div>
      <DemoStripeForm totalPence={draft.totalPence} />
    </main>
  );
}
