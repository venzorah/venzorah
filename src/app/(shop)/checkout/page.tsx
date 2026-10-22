import Link from "next/link";
import { CheckoutDelivery, type SavedDeliveryAddress } from "@/components/checkout-delivery";
import { SignInToCheckout } from "@/components/sign-in-to-checkout";
import { PageHeader } from "@/components/ui";
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
  let addresses: SavedDeliveryAddress[] = [];
  if (!user.id.startsWith("demo-")) {
    try {
      const saved = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
      addresses = saved.map((address) => ({
        id: address.id,
        label: address.label,
        line1: address.line1,
        city: address.city,
        region: address.region ?? "",
        postcode: address.postcode,
        isDefault: address.isDefault,
      }));
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
            <p className="text-xs text-muted">
              Each store ships separately. The payment step shows that store&apos;s delivery options. Shipping is not estimated in the browser.
            </p>
          </div>
          <CheckoutDelivery buyerName={user.name} addresses={addresses} />
        </>
      )}
    </main>
  );
}
