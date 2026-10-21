import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatGbp } from "@/lib/money";
import { updateCartItem } from "@/app/actions/marketplace";
import { Button, EmptyState, PageHeader } from "@/components/ui";

export default async function CartPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Sign in to use your cart.">
          <Link href="/login" className="mt-3 inline-block font-semibold">
            Sign in
          </Link>
        </EmptyState>
      </main>
    );
  }
  const cart = await prisma.cart.findFirst({
    where: { userId: user.id },
    include: { items: { include: { product: true, variant: true } } },
  });
  const items = cart?.items ?? [];
  const total = items.reduce(
    (sum, item) => sum + (item.variant.pricePence ?? item.product.pricePence) * item.quantity,
    0,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Your cart" />
      {items.length === 0 ? (
        <EmptyState title="Your cart is empty." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-semibold">{item.product.name}</p>
                <p className="text-sm text-muted">
                  {item.variant.name} · {formatGbp(item.variant.pricePence ?? item.product.pricePence)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={async () => { "use server"; await updateCartItem(item.id, item.quantity - 1); }}>
                  <Button type="submit" variant="secondary" aria-label="Decrease quantity">
                    −
                  </Button>
                </form>
                <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <form action={async () => { "use server"; await updateCartItem(item.id, item.quantity + 1); }}>
                  <Button type="submit" variant="secondary" aria-label="Increase quantity">
                    +
                  </Button>
                </form>
              </div>
            </div>
          ))}
          <p className="text-right text-lg font-bold">Subtotal {formatGbp(total)}</p>
          <Link href="/checkout">
            <Button className="w-full">Checkout</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
