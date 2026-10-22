export const DEMO_SHIPPING_PENCE = 395;
export const DEMO_FREE_SHIPPING_PENCE = 4000;

export function demoShippingPence(subtotalPence: number) {
  if (subtotalPence <= 0) return 0;
  return subtotalPence >= DEMO_FREE_SHIPPING_PENCE ? 0 : DEMO_SHIPPING_PENCE;
}

export type DemoCardResult = { ok: true } | { ok: false; error: string };

/** Checks the public Stripe test cards. Callers must not store or log the number. */
export function assessDemoCard(number: string, expiry: string, cvc: string, now = new Date()): DemoCardResult {
  const pan = number.replace(/\s+/g, "");
  const exp = expiry.trim();
  const code = cvc.trim();
  if (!/^\d{3,4}$/.test(code)) {
    return { ok: false, error: "Enter a 3-digit CVC. Card numbers are not stored." };
  }
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(exp);
  if (!match) return { ok: false, error: "Use an expiry like 12/34." };
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const expires = new Date(year, month, 1);
  if (expires <= now) return { ok: false, error: "Use a future expiry." };
  if (pan === "4000000000000002") return { ok: false, error: "Your card was declined." };
  if (pan !== "4242424242424242") {
    return { ok: false, error: "Use the demo card 4242 4242 4242 4242. No real charge is made." };
  }
  return { ok: true };
}
