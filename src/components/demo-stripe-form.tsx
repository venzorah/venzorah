"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { payWithDemoStripe } from "@/app/actions/demo-checkout";
import { Button, Field, Input } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export function DemoStripeForm({ totalPence }: { totalPence: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-card p-4"
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        start(async () => {
          const result = await payWithDemoStripe(data);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          router.push("/checkout/complete");
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold text-ink">Demo Stripe</p>
        <p className="mt-1 text-sm text-muted">
          Pay {formatGbp(totalPence)} with the test card 4242 4242 4242 4242. Any future expiry and any CVC. The card
          4000 0000 0000 0002 is declined. No real charge is made, and the card number is not stored.
        </p>
      </div>
      {error ? <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
      <Field label="Card number">
        <Input name="cardNumber" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiry">
          <Input name="cardExpiry" inputMode="numeric" autoComplete="off" placeholder="12/34" required />
        </Field>
        <Field label="CVC">
          <Input name="cardCvc" inputMode="numeric" autoComplete="off" placeholder="123" required />
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Checking card…" : `Pay ${formatGbp(totalPence)}`}
      </Button>
    </form>
  );
}
