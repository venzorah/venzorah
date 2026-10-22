import { describe, expect, it } from "vitest";
import {
  allocateOrder,
  balancesFromLines,
  canCompletePayout,
  canRecordPayment,
  chooseShippingQuote,
  coveredCommissionBps,
  ledgerDifference,
  ownsVendorRecord,
  paymentLedger,
  quotedShippingPrice,
  refundAdjustment,
  releaseLedger,
  type VendorAllocation,
  type VendorChargeInput,
} from "../src/lib/allocation";

function vendor(input: Partial<VendorChargeInput> & Pick<VendorChargeInput, "vendorId" | "productSubtotalPence" | "shippingPence" | "premium">): VendorChargeInput {
  return {
    vendorName: input.vendorId,
    shippingMethodId: "standard",
    shippingMethodName: "Standard",
    shippingMethodCode: "STANDARD",
    taxPence: 0,
    ...input,
  };
}

describe("multi-vendor shipping and commission", () => {
  it("allocates the £58.50 two-vendor example with no remainder", () => {
    const order = allocateOrder(
      [
        vendor({ vendorId: "A", productSubtotalPence: 3000, shippingPence: 500, premium: false }),
        vendor({ vendorId: "B", productSubtotalPence: 2000, shippingPence: 350, premium: true }),
      ],
      0,
    );
    const a = order.vendors[0];
    const b = order.vendors[1];
    expect(a.commissionPence).toBe(150);
    expect(a.vendorPence).toBe(3350);
    expect(b.commissionPence).toBe(0);
    expect(b.vendorPence).toBe(2350);
    expect(order.paymentPence).toBe(5850);
    expect(order.commissionPence).toBe(150);
    expect(a.vendorPence + b.vendorPence + order.commissionPence).toBe(5850);
    expect(order.differencePence).toBe(0);
    expect(ledgerDifference(order.paymentPence, paymentLedger(order.vendors), 0)).toBe(0);
  });

  it("calculates a single vendor from product sales only", () => {
    const order = allocateOrder([vendor({ vendorId: "A", productSubtotalPence: 3000, shippingPence: 500, premium: false })], 0);
    expect(order.vendors[0].commissionPence).toBe(150);
    expect(order.vendors[0].shippingPence).toBe(500);
    expect(order.paymentPence).toBe(3500);
    expect(order.differencePence).toBe(0);
  });

  it("keeps three vendors reconciled and gives each their own shipping fee", () => {
    const order = allocateOrder(
      [
        vendor({ vendorId: "A", productSubtotalPence: 1000, shippingPence: 200, premium: false }),
        vendor({ vendorId: "B", productSubtotalPence: 2500, shippingPence: 0, premium: true }),
        vendor({ vendorId: "C", productSubtotalPence: 4000, shippingPence: 650, premium: false }),
      ],
      0,
    );
    expect(order.vendors.map((row) => row.shippingPence)).toEqual([200, 0, 650]);
    expect(order.vendors[1].commissionPence).toBe(0);
    expect(order.vendors[0].commissionPence).toBe(50);
    expect(order.vendors[2].commissionPence).toBe(200);
    expect(order.differencePence).toBe(0);
    expect(new Set(order.vendors.map((row) => row.vendorId)).size).toBe(3);
  });

  it("charges a free vendor 5% and a covered premium vendor nothing", () => {
    expect(coveredCommissionBps({ key: "free", pricePence: 0, commissionBps: 500 })).toBe(500);
    expect(coveredCommissionBps({ key: "monthly", pricePence: 3500, commissionBps: 300 })).toBe(0);
    const free = allocateOrder([vendor({ vendorId: "A", productSubtotalPence: 2000, shippingPence: 100, premium: false })], 0);
    const premium = allocateOrder([vendor({ vendorId: "B", productSubtotalPence: 2000, shippingPence: 100, premium: true })], 0);
    expect(free.vendors[0].commissionBps).toBe(500);
    expect(premium.vendors[0].commissionBps).toBe(0);
    expect(premium.vendors[0].commissionPence).toBe(0);
  });

  it("never includes shipping in the commission base", () => {
    const order = allocateOrder([vendor({ vendorId: "A", productSubtotalPence: 1000, shippingPence: 10_000, premium: false })], 0);
    expect(order.vendors[0].commissionPence).toBe(50);
    expect(order.vendors[0].vendorPence).toBe(950 + 10_000);
  });

  it("ignores a browser shipping price and uses the server quote", () => {
    const quotes = [
      { id: "std", name: "Standard", code: "STANDARD", pricePence: 500 },
      { id: "exp", name: "Express", code: "EXPRESS", pricePence: 900 },
    ];
    expect(chooseShippingQuote(quotes).pricePence).toBe(500);
    expect(chooseShippingQuote(quotes, "exp").pricePence).toBe(900);
    expect(() => chooseShippingQuote(quotes, "forged")).toThrow(/not available/);
  });

  it("applies express rates and free-shipping thresholds", () => {
    expect(quotedShippingPrice(500, 2000, 2500)).toBe(0);
    expect(quotedShippingPrice(500, 2000, 1999)).toBe(500);
    expect(quotedShippingPrice(900, null, 10_000)).toBe(900);
  });

  it("reverses commission on a product refund and leaves shipping with the vendor", () => {
    const order = allocateOrder([vendor({ vendorId: "A", productSubtotalPence: 3000, shippingPence: 500, premium: false })], 0);
    const refund = refundAdjustment({ productRefundPence: 1000, commissionBps: 500 });
    expect(refund.shippingRefundPence).toBe(0);
    expect(refund.commissionReversalPence).toBe(50);
    expect(refund.vendorDeductionPence).toBe(950);
    expect(refund.buyerRefundPence).toBe(refund.vendorDeductionPence + refund.commissionReversalPence);
    const lines = [
      ...paymentLedger(order.vendors),
      { vendorId: "A", vendorOrderKey: "A", type: "REFUND_DEDUCTION", amountPence: refund.vendorDeductionPence },
      { vendorId: "A", vendorOrderKey: "A", type: "COMMISSION_REVERSAL", amountPence: refund.commissionReversalPence },
    ];
    expect(ledgerDifference(order.paymentPence, lines, 0)).toBe(0);
  });

  it("holds only the disputed vendor when earnings are released", () => {
    const order = allocateOrder(
      [
        vendor({ vendorId: "A", productSubtotalPence: 3000, shippingPence: 500, premium: false }),
        vendor({ vendorId: "B", productSubtotalPence: 2000, shippingPence: 350, premium: true }),
      ],
      0,
    );
    const lines = [
      ...paymentLedger(order.vendors),
      ...releaseLedger(order.vendors[0], true),
      ...releaseLedger(order.vendors[1], false),
    ];
    const a = balancesFromLines(lines.filter((line) => line.vendorId === "A"));
    const b = balancesFromLines(lines.filter((line) => line.vendorId === "B"));
    expect(a.pendingPence).toBe(3350);
    expect(a.availablePence).toBe(0);
    expect(b.pendingPence).toBe(0);
    expect(b.availablePence).toBe(2350);
  });

  it("rejects a duplicate payment and a second completion of the same payout", () => {
    expect(canRecordPayment(null)).toBe(true);
    expect(canRecordPayment("pay_123")).toBe(false);
    expect(canCompletePayout("PENDING")).toBe(true);
    expect(canCompletePayout("FAILED")).toBe(true);
    expect(canCompletePayout("COMPLETED")).toBe(false);
    expect(canCompletePayout("REJECTED")).toBe(false);
  });

  it("stops a vendor reading another vendor's records", () => {
    expect(ownsVendorRecord("vendor-a", "vendor-a")).toBe(true);
    expect(ownsVendorRecord("vendor-a", "vendor-b")).toBe(false);
    expect(ownsVendorRecord(null, "vendor-a")).toBe(false);
  });

  it("keeps a refunded amount out of the available balance", () => {
    const vendorRow = allocateOrder([vendor({ vendorId: "A", productSubtotalPence: 3000, shippingPence: 500, premium: false })], 0).vendors[0];
    const refund = refundAdjustment({ productRefundPence: 3000, shippingRefundPence: 500, commissionBps: 500 });
    const lines = [
      ...paymentLedger([vendorRow as VendorAllocation]),
      ...releaseLedger(vendorRow, false),
      { vendorId: "A", vendorOrderKey: "A", type: "REFUND_DEDUCTION", amountPence: refund.vendorDeductionPence },
      { vendorId: "A", vendorOrderKey: "A", type: "COMMISSION_REVERSAL", amountPence: refund.commissionReversalPence },
    ];
    const balances = balancesFromLines(lines);
    expect(balances.availablePence).toBe(0);
    expect(balances.refundsPence).toBe(refund.vendorDeductionPence);
    expect(refund.buyerRefundPence).toBe(refund.vendorDeductionPence + refund.commissionReversalPence);
    expect(ledgerDifference(3500, lines, 0)).toBe(0);
  });
});
