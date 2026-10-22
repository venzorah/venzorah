import Link from "next/link";
import { checkoutAction } from "@/app/actions/marketplace";
import { SignInToCheckout } from "@/components/sign-in-to-checkout";
import { ActionForm } from "@/components/forms";
import { UkAddressFields } from "@/components/uk-address-fields";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { checkoutActor } from "@/lib/checkout-actor";
import { formatGbp } from "@/lib/money";
import { storeCartLines } from "@/lib/store-checkout";
import { prisma } from "@/lib/db";

export default async function CheckoutPage() {
  const user = await checkoutActor();
  if (!user) {
    const lines = await storeCartLines(null);
    return <SignInToCheckout lines={lines} />;
  }

  const lines = await storeCartLines(user);
  const subtotal = lines.reduce((sum, line) => sum + line.unitPence * line.quantity, 0);
  let defaultAddress: { line1: string; city: string; region: string; postcode: string } | null = null;
  if (!user.id.startsWith("demo-")) {
    try {
      const addresses = await prisma.address.findMany({ where: { userId: user.id } });
      const found = addresses.find((address) => address.isDefault) ?? addresses[0];
      if (found) {
        defaultAddress = { line1: found.line1, city: found.city, region: found.region ?? "", postcode: found.postcode };
      }
    } catch (error) {
      console.error("[checkout] addresses unavailable", error instanceof Error ? error.message : error);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Checkout"
        description="Sign-in is required. Demo Stripe accepts the public test card and does not store the number."
      />
      {lines.length === 0 ? (
        <p className="text-sm text-muted">
          Your cart is empty.{" "}
          <Link href="/products" className="font-semibold text-ink underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <>
          <div className="mb-6 grid gap-2 rounded-2xl border border-border bg-card p-4">
            {lines.map((line) => (
              <p key={`${line.source}-${line.id}`} className="text-sm">
                {line.name} × {line.quantity} — {formatGbp(line.unitPence * line.quantity)}
                <span className="text-muted"> · {line.vendor}</span>
              </p>
            ))}
            <p className="pt-2 text-sm font-semibold">Items {formatGbp(subtotal)}</p>
            <p className="text-xs text-muted">Shipping is added on the payment step from your delivery postcode.</p>
          </div>
          <ActionForm action={checkoutAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <Field label="Full name">
              <Input name="shippingName" defaultValue={user.name} required autoComplete="name" />
            </Field>
            <UkAddressFields
              line1Name="shippingLine1"
              cityName="shippingCity"
              regionName="shippingRegion"
              postcodeName="shippingPostcode"
              defaultLine1={defaultAddress?.line1}
              defaultCity={defaultAddress?.city}
              defaultRegion={defaultAddress?.region}
              defaultPostcode={defaultAddress?.postcode}
            />
            <Field label="Coupon (optional)">
              <Input name="coupon" />
            </Field>
            <Button type="submit" className="rounded-full">
              Continue to demo Stripe
            </Button>
          </ActionForm>
        </>
      )}
    </main>
  );
}
