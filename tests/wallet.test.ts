import { describe, expect, it } from "vitest";
import { canReleaseToWallet } from "../src/lib/allocation";
import { buyerBalancePence, normaliseUkBank } from "../src/lib/wallet";

const day = 24 * 60 * 60 * 1000;

describe("vendor wallet release", () => {
  const placedAt = new Date("2026-10-01T10:00:00Z");

  it("keeps an order held until 7 days have passed with no complaint", () => {
    expect(
      canReleaseToWallet({
        paid: true,
        settled: false,
        openDispute: false,
        placedAt,
        customerConfirmedAt: null,
        now: new Date(placedAt.getTime() + 6 * day),
        delayDays: 7,
      }),
    ).toBe(false);
    expect(
      canReleaseToWallet({
        paid: true,
        settled: false,
        openDispute: false,
        placedAt,
        customerConfirmedAt: null,
        now: new Date(placedAt.getTime() + 7 * day),
        delayDays: 7,
      }),
    ).toBe(true);
  });

  it("blocks a withdrawal while a complaint is open", () => {
    expect(
      canReleaseToWallet({
        paid: true,
        settled: false,
        openDispute: true,
        placedAt,
        customerConfirmedAt: null,
        now: new Date(placedAt.getTime() + 10 * day),
        delayDays: 7,
      }),
    ).toBe(false);
  });
});

describe("buyer wallet", () => {
  it("adds top-ups and refunds, and subtracts purchases and payouts", () => {
    expect(
      buyerBalancePence([
        { type: "TOP_UP", amountPence: 5000 },
        { type: "PURCHASE", amountPence: 1200 },
        { type: "REFUND", amountPence: 200 },
        { type: "PAYOUT", amountPence: 1000 },
      ]),
    ).toBe(3000);
  });

  it("accepts a UK sort code and 8-digit account number", () => {
    expect(normaliseUkBank("20-00-00", "12345678")).toEqual({
      sortCode: "20-00-00",
      accountNumber: "12345678",
      last4: "5678",
    });
    expect(normaliseUkBank("2000", "1234567")).toBeNull();
  });
});
