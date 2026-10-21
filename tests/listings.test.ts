import { describe, expect, it } from "vitest";
import { listingLimitReached } from "../src/lib/listings";
import { PERMISSIONS, ROLE_KEYS } from "../src/lib/permissions";
import { parseGbpToPence, vendorNet } from "../src/lib/money";

describe("listing limits", () => {
  it("enforces the free-plan cap without deleting listings", () => {
    expect(listingLimitReached(5, 5)).toBe(true);
    expect(listingLimitReached(4, 5)).toBe(false);
    expect(listingLimitReached(100, null)).toBe(false);
  });
});

describe("permissions", () => {
  it("keeps unique permission keys", () => {
    const keys = PERMISSIONS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("defines required marketplace roles", () => {
    expect(ROLE_KEYS.ADMIN).toBe("admin");
    expect(ROLE_KEYS.VENDOR).toBe("vendor");
    expect(ROLE_KEYS.VERIFIED_VENDOR).toBe("verified_vendor");
    expect(ROLE_KEYS.CUSTOMER).toBe("customer");
  });
});

describe("plan economics", () => {
  it("uses the seeded monthly price and commission basis points", () => {
    expect(parseGbpToPence("35")).toBe(3500);
    expect(vendorNet(10_000, 500)).toEqual({ commissionPence: 500, vendorNetPence: 9500 });
    expect(vendorNet(10_000, 300)).toEqual({ commissionPence: 300, vendorNetPence: 9700 });
  });
});
