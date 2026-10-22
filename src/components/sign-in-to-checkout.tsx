import Link from "next/link";
import { formatGbp } from "@/lib/money";

const STEPS = ["Basket", "Account", "Delivery", "Pay"];

export function SignInToCheckout({
  lines = [],
}: {
  lines?: { id: string; name: string; vendor: string; quantity: number; unitPence: number }[];
}) {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPence * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Checkout</h1>
        <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold" aria-label="Checkout progress">
          {STEPS.map((step, index) => {
            const active = index === 1;
            const done = index < 1;
            return (
              <li key={step} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                <span
                  className={
                    done
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[11px] text-white"
                      : active
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] text-navy"
                        : "flex h-6 w-6 items-center justify-center rounded-full bg-card text-[11px] text-muted ring-1 ring-border"
                  }
                >
                  {index + 1}
                </span>
                <span className={active || done ? "text-ink" : "text-muted"}>{step}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border sm:p-7" aria-labelledby="basket-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="basket-heading" className="text-lg font-bold text-ink">
              Your basket
            </h2>
            <p className="text-sm text-muted">{itemCount} items</p>
          </div>
          {lines.length ? (
            <ul className="mt-4 divide-y divide-border">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{line.name}</p>
                    <p className="text-xs text-muted">
                      Sold by <span className="font-semibold text-ink">{line.vendor}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{formatGbp(line.unitPence * line.quantity)}</p>
                    <p className="text-xs text-muted">
                      {line.quantity} × {formatGbp(line.unitPence)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Your basket is empty.{" "}
              <Link href="/products" className="font-semibold text-ink underline">
                Continue shopping
              </Link>
            </p>
          )}
          <dl className="mt-2 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-muted">Added after you sign in</dd>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <dt className="font-bold text-ink">Subtotal</dt>
              <dd className="text-2xl font-extrabold text-ink">{formatGbp(subtotal)}</dd>
            </div>
          </dl>
        </section>

        <section className="overflow-hidden rounded-3xl bg-card ring-1 ring-border lg:sticky lg:top-24">
          <div className="bg-navy px-6 py-6 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-sm font-extrabold text-navy">
              Pay
            </span>
            <h2 className="mt-4 text-xl font-extrabold tracking-tight">Sign in to pay</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/80">
              Browsing and adding to your basket does not need an account. Payment needs a buyer sign-in so the order can be delivered to you. Your basket is kept.
            </p>
          </div>
          <div className="px-6 py-6">
            <div className="grid gap-3">
              <Link
                href="/login?next=/checkout"
                className="tap-target inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-bold text-navy"
              >
                Sign in
              </Link>
              <Link
                href="/register?next=/checkout"
                className="tap-target inline-flex items-center justify-center rounded-full bg-card px-5 py-3 text-sm font-bold text-ink ring-1 ring-inset ring-navy"
              >
                Create an account
              </Link>
            </div>
            <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted">
              Signed-in buyers continue to delivery, then pay with Stripe in demo mode. No real card is charged.
            </p>
            <Link href="/cart" className="mt-4 inline-block text-sm font-semibold text-ink">
              Back to cart
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
