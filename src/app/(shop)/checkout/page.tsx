import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkoutAction } from "@/app/actions/marketplace";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/forms";
import { formatGbp } from "@/lib/money";
import { CommerceError, shippingQuote } from "@/lib/commerce";

export default async function CheckoutPage() {
  const user = await requireUser();
  const [addresses, cart] = await Promise.all([
    prisma.address.findMany({ where: { userId: user.id } }),
    prisma.cart.findFirst({
      where: { userId: user.id },
      include: { items: { include: { product: { include: { vendor: true } }, variant: true } } },
    }),
  ]);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const grouped = new Map<string, NonNullable<typeof cart>["items"]>();
  for (const item of cart?.items ?? []) {
    const list = grouped.get(item.product.vendorId) ?? [];
    list.push(item);
    grouped.set(item.product.vendorId, list);
  }

  const vendorQuotes = [];
  for (const [vendorId, items] of grouped) {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.variant.pricePence ?? item.product.pricePence) * item.quantity,
      0,
    );
    let shippingPence = 0;
    let shippingName = "Unavailable";
    let error: string | null = null;
    if (defaultAddress) {
      try {
        const quotes = await shippingQuote(vendorId, defaultAddress.postcode, subtotal);
        const cheapest = [...quotes].sort((a, b) => a.pricePence - b.pricePence)[0];
        shippingPence = cheapest?.pricePence ?? 0;
        shippingName = cheapest ? `${cheapest.name} (${cheapest.carrier ?? "carrier"})` : "Unavailable";
      } catch (err) {
        error = err instanceof CommerceError ? err.message : "Shipping is not available for this destination.";
      }
    }
    vendorQuotes.push({
      vendorId,
      store: items[0]?.product.vendor.storeName ?? "Vendor",
      items,
      subtotal,
      shippingPence,
      shippingName,
      error,
    });
  }
  const blocked = vendorQuotes.some((v) => v.error);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Checkout"
        description="Prices, stock and shipping are re-validated on the server. A browser redirect is never treated as proof of payment."
      />
      <div className="mb-6 grid gap-3">
        {vendorQuotes.map((group) => (
          <section key={group.vendorId} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">{group.store}</p>
            {group.items.map((item) => (
              <p key={item.id} className="text-sm">
                {item.product.name} × {item.quantity} —{" "}
                {formatGbp((item.variant.pricePence ?? item.product.pricePence) * item.quantity)}
              </p>
            ))}
            <p className="mt-2 text-sm text-muted">
              Items {formatGbp(group.subtotal)} · Shipping {group.error ? "—" : formatGbp(group.shippingPence)} ·{" "}
              {group.shippingName}
            </p>
            {group.error ? <p className="mt-1 text-sm text-error">{group.error}</p> : null}
          </section>
        ))}
      </div>
      {!defaultAddress ? (
        <p className="mb-4 text-sm text-warning">
          Add a UK delivery address in your account before placing an order.{" "}
          <Link href="/account/addresses" className="font-semibold underline">
            Manage addresses
          </Link>
        </p>
      ) : null}
      {blocked ? (
        <p className="mb-4 text-sm text-error">
          Checkout is blocked until every vendor can ship to the destination postcode.
        </p>
      ) : null}
      <ActionForm action={checkoutAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
        <Field label="Full name">
          <Input name="shippingName" defaultValue={user.name} required autoComplete="name" />
        </Field>
        <Field label="Address line 1">
          <Input name="shippingLine1" defaultValue={defaultAddress?.line1} required autoComplete="address-line1" />
        </Field>
        <Field label="City">
          <Input name="shippingCity" defaultValue={defaultAddress?.city} required autoComplete="address-level2" />
        </Field>
        <Field label="Postcode">
          <Input
            name="shippingPostcode"
            defaultValue={defaultAddress?.postcode}
            required
            autoComplete="postal-code"
          />
        </Field>
        <Field label="Coupon (optional)">
          <Input name="coupon" />
        </Field>
        <Button type="submit" disabled={!defaultAddress || blocked || vendorQuotes.length === 0}>
          Pay with sandbox checkout
        </Button>
        <p className="text-xs text-muted">
          Sandbox mode confirms payment immediately after server-side validation. Configure Stripe keys to use
          live or test-card checkout. VAT is recorded according to the platform setting and is not treated as
          marketplace commission.
        </p>
      </ActionForm>
    </main>
  );
}
