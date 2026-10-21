import { describe, expect, it } from "vitest";
import { applyBps, formatGbp, parseGbpToPence, vendorNet } from "../src/lib/money";
import { methodServesPostcode } from "../src/lib/utils";

describe("money", () => {
  it("stores integer pence", () => {
    expect(parseGbpToPence("35.00")).toBe(3500);
    expect(parseGbpToPence("4.95")).toBe(495);
    expect(formatGbp(3500)).toBe("£35.00");
  });

  it("applies commission in basis points", () => {
    expect(applyBps(10000, 500)).toBe(500);
    expect(vendorNet(10000, 300)).toEqual({ commissionPence: 300, vendorNetPence: 9700 });
  });

  it("rejects non-integer money", () => {
    expect(() => applyBps(10.5 as number, 500)).toThrow();
  });
});

describe("shipping zones", () => {
  it("matches UK prefixes", () => {
    expect(methodServesPostcode("E,M,LS", "E1 6AN")).toBe(true);
    expect(methodServesPostcode("M", "E1 6AN")).toBe(false);
    expect(methodServesPostcode("GB,*", "EH1 1AA")).toBe(true);
  });
});
