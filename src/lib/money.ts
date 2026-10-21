/** All money is stored as integer minor units (pence). Never use floats. */
export const ZERO_PENCE = 0;

export function pence(amount: number) {
  if (!Number.isInteger(amount)) {
    throw new Error("Money amounts must be integer pence");
  }
  return amount;
}

export function addPence(...amounts: number[]) {
  return amounts.reduce((sum, value) => sum + pence(value), 0);
}

export function subtractPence(left: number, right: number) {
  return pence(left) - pence(right);
}

/** Apply basis points (10000 = 100%). 5% = 500 bps. */
export function applyBps(amountPence: number, bps: number) {
  if (!Number.isInteger(amountPence) || !Number.isInteger(bps)) {
    throw new Error("Commission math requires integers");
  }
  return Math.round((amountPence * bps) / 10000);
}

export function formatGbp(amountPence: number) {
  const sign = amountPence < 0 ? "-" : "";
  const abs = Math.abs(amountPence);
  return `${sign}£${(abs / 100).toFixed(2)}`;
}

export function parseGbpToPence(input: string) {
  const cleaned = input.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error("Enter a valid GBP amount");
  }
  const [pounds, fraction = ""] = cleaned.split(".");
  const frac = (fraction + "00").slice(0, 2);
  return Number(pounds) * 100 + Number(frac);
}

export function vendorNet(subtotalPence: number, commissionBps: number) {
  const commission = applyBps(subtotalPence, commissionBps);
  return {
    commissionPence: commission,
    vendorNetPence: subtotalPence - commission,
  };
}

export const SETTLEMENT_DELAY_DAYS = 7;
