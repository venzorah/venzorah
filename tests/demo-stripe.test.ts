import { describe, expect, it } from "vitest";
import { assessDemoCard, demoShippingPence } from "../src/lib/demo-stripe";
import { readPayload, signPayload } from "../src/lib/signed-payload";
import { safeNextPath } from "../src/lib/safe-next";

describe("demo stripe checkout", () => {
  it("accepts the public test card and declines the public decline card", () => {
    expect(assessDemoCard("4242 4242 4242 4242", "12/34", "123", new Date("2026-01-01"))).toEqual({ ok: true });
    expect(assessDemoCard("4000000000000002", "12/34", "123", new Date("2026-01-01")).ok).toBe(false);
    expect(assessDemoCard("4111111111111111", "12/34", "123", new Date("2026-01-01")).ok).toBe(false);
    expect(assessDemoCard("4242424242424242", "01/20", "123", new Date("2026-01-01")).ok).toBe(false);
  });

  it("adds flat UK shipping until the basket is large enough", () => {
    expect(demoShippingPence(1000)).toBe(395);
    expect(demoShippingPence(4000)).toBe(0);
    expect(demoShippingPence(0)).toBe(0);
  });

  it("only allows a same-site return path", () => {
    expect(safeNextPath("/checkout")).toBe("/checkout");
    expect(safeNextPath("/checkout?paid=1")).toBe("/checkout?paid=1");
    expect(safeNextPath("https://evil.example/checkout")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
  });

  it("round-trips a signed checkout draft and rejects another kind", () => {
    const token = signPayload("draft", { userId: "demo-customer", totalPence: 1094 }, 1000, 1_000);
    expect(readPayload(token, "draft", 1_500)).toEqual({ userId: "demo-customer", totalPence: 1094 });
    expect(readPayload(token, "cart", 1_500)).toBeNull();
    expect(readPayload(token, "draft", 3_000)).toBeNull();
  });
});
