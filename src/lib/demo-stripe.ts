export const DEMO_SHIPPING_PENCE = 395;
export const DEMO_FREE_SHIPPING_PENCE = 4000;

export function demoShippingPence(subtotalPence: number) {
  if (subtotalPence <= 0) return 0;
  return subtotalPence >= DEMO_FREE_SHIPPING_PENCE ? 0 : DEMO_SHIPPING_PENCE;
}

export type DemoCardResult = { ok: true } | { ok: false; error: string };

/** Keeps a card expiry as MM/YY. A month such as 17 is not kept. */
export function formatCardExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (!digits) return "";
  if (Number(digits[0]) > 1) {
    const month = `0${digits[0]}`;
    const year = digits.slice(1, 3);
    return year ? `${month}/${year}` : `${month}/`;
  }
  if (digits.length === 1) return digits;
  const monthNumber = Number(digits.slice(0, 2));
  if (monthNumber === 0) return "0";
  if (monthNumber > 12) return "1";
  const month = digits.slice(0, 2);
  const year = digits.slice(2, 4);
  return year ? `${month}/${year}` : `${month}/`;
}

/** Checks the public Stripe test cards. Callers must not store or log the number. */
export function assessDemoCard(number: string, expiry: string, cvc: string, now = new Date()): DemoCardResult {
  const pan = number.replace(/\s+/g, "");
  const exp = formatCardExpiry(expiry);
  const code = cvc.trim();
  if (!/^\d{3,4}$/.test(code)) {
    return { ok: false, error: "Enter a 3-digit CVC. Card numbers are not stored." };
  }
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(exp);
  if (!match) return { ok: false, error: "Enter the expiry as MM/YY, for example 12/29." };
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  // Valid through the last day of the expiry month. JS months are 0-based, so month 1–12 is the next month.
  const expires = new Date(year, month, 1);
  if (expires <= now) return { ok: false, error: "That card has expired. Use a future month and year." };
  if (pan === "4000000000000002") return { ok: false, error: "Your card was declined." };
  if (pan !== "4242424242424242") {
    return { ok: false, error: "Use the demo card 4242 4242 4242 4242. No real charge is made." };
  }
  return { ok: true };
}
