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
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.product.name}</p>
                <p className="text-sm text-muted">
                  {item.variant.name} · {formatGbp(item.variant.pricePence ?? item.product.pricePence)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                <form action={async () => { "use server"; await updateCartItem(item.id, 0); }}>
                  <button
                    type="submit"
                    aria-label={`Remove ${item.product.name}`}
                    className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-error"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M4 7h16" strokeLinecap="round" />
                      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                      <path d="M6.5 7l.9 12.2A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7" strokeLinecap="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                    </svg>
                  </button>
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
