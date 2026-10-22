import { applyBps } from "./money";

/** Free-plan commission: 5% of eligible product sales. Shipping is never part of this base. */
export const FREE_COMMISSION_BPS = 500;

/** Orders written with this version include the shipping fee inside the vendor allocation. */
export const ALLOCATION_VERSION = 2;

export type ShippingQuote = {
  id: string;
  name: string;
  code: string;
  pricePence: number;
};

export type VendorChargeInput = {
  vendorId: string;
  vendorName: string;
  productSubtotalPence: number;
  shippingPence: number;
  shippingMethodId: string;
  shippingMethodName: string;
  shippingMethodCode: string;
  premium: boolean;
  taxPence: number;
};

export type VendorAllocation = VendorChargeInput & {
  discountPence: number;
  eligibleProductPence: number;
  commissionBps: number;
  commissionPence: number;
  productProceedsPence: number;
  vendorPence: number;
};

export type SettlementLine = {
  vendorId: string;
  vendorOrderKey: string;
  type: string;
  amountPence: number;
};

export function coveredCommissionBps(plan: { key: string; pricePence: number; commissionBps: number }) {
  if (plan.key !== "free" && plan.pricePence > 0) return 0;
  return plan.commissionBps;
}

export function quotedShippingPrice(pricePence: number, freeAbovePence: number | null | undefined, subtotalPence: number) {
  if (freeAbovePence != null && subtotalPence >= freeAbovePence) return 0;
  return pricePence;
}

/** The charged price always comes from the server quote. A requested id only selects a quote. */
export function chooseShippingQuote<T extends ShippingQuote>(quotes: T[], requestedId?: string | null): T {
  if (!quotes.length) {
    throw new Error("No shipping method serves this address.");
  }
  if (requestedId) {
    const found = quotes.find((quote) => quote.id === requestedId);
    if (!found) throw new Error("That delivery option is not available for this vendor.");
    return found;
  }
  const standard = quotes.find((quote) => quote.code.toUpperCase() === "STANDARD");
  if (standard) return standard;
  return [...quotes].sort((a, b) => a.pricePence - b.pricePence || a.name.localeCompare(b.name))[0];
}

export function allocateDiscount(subtotals: number[], discountPence: number) {
  const total = subtotals.reduce((sum, value) => sum + value, 0);
  const discount = Math.min(Math.max(0, discountPence), Math.max(0, total));
  if (!discount || !total) return subtotals.map(() => 0);
  const exact = subtotals.map((subtotal) => (discount * subtotal) / total);
  const shares = exact.map((value) => Math.floor(value));
  let left = discount - shares.reduce((sum, value) => sum + value, 0);
  const remainders = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const row of remainders) {
    if (left <= 0) break;
    shares[row.index] += 1;
    left -= 1;
  }
  return shares;
}

export function allocateVendor(input: {
  productSubtotalPence: number;
  discountPence: number;
  shippingPence: number;
  premium: boolean;
  freeCommissionBps?: number;
}) {
  const eligibleProductPence = Math.max(0, input.productSubtotalPence - input.discountPence);
  const commissionBps = input.premium ? 0 : (input.freeCommissionBps ?? FREE_COMMISSION_BPS);
  const commissionPence = applyBps(eligibleProductPence, commissionBps);
  const productProceedsPence = eligibleProductPence - commissionPence;
  const shippingPence = input.shippingPence;
  return {
    eligibleProductPence,
    commissionBps,
    commissionPence,
    productProceedsPence,
    shippingPence,
    vendorPence: productProceedsPence + shippingPence,
  };
}

export function allocateOrder(vendors: VendorChargeInput[], orderDiscountPence: number) {
  const discounts = allocateDiscount(
    vendors.map((vendor) => vendor.productSubtotalPence),
    orderDiscountPence,
  );
  const allocated: VendorAllocation[] = vendors.map((vendor, index) => ({
    ...vendor,
    discountPence: discounts[index] ?? 0,
    ...allocateVendor({
      productSubtotalPence: vendor.productSubtotalPence,
      discountPence: discounts[index] ?? 0,
      shippingPence: vendor.shippingPence,
      premium: vendor.premium,
    }),
  }));
  const subtotalPence = allocated.reduce((sum, vendor) => sum + vendor.productSubtotalPence, 0);
  const shippingPence = allocated.reduce((sum, vendor) => sum + vendor.shippingPence, 0);
  const taxPence = allocated.reduce((sum, vendor) => sum + vendor.taxPence, 0);
  const discountPence = allocated.reduce((sum, vendor) => sum + vendor.discountPence, 0);
  const commissionPence = allocated.reduce((sum, vendor) => sum + vendor.commissionPence, 0);
  const vendorPence = allocated.reduce((sum, vendor) => sum + vendor.vendorPence, 0);
  const paymentPence = subtotalPence + shippingPence + taxPence - discountPence;
  return {
    vendors: allocated,
    subtotalPence,
    shippingPence,
    taxPence,
    discountPence,
    commissionPence,
    vendorPence,
    paymentPence,
    differencePence: paymentPence - (vendorPence + commissionPence + taxPence),
  };
}

export function paymentLedger(vendors: VendorAllocation[]): SettlementLine[] {
  const lines: SettlementLine[] = [];
  for (const vendor of vendors) {
    lines.push({
      vendorId: vendor.vendorId,
      vendorOrderKey: vendor.vendorId,
      type: "PENDING_EARNING",
      amountPence: vendor.productProceedsPence,
    });
    lines.push({
      vendorId: vendor.vendorId,
      vendorOrderKey: vendor.vendorId,
      type: "SHIPPING_ALLOCATION",
      amountPence: vendor.shippingPence,
    });
    if (vendor.commissionPence) {
      lines.push({
        vendorId: vendor.vendorId,
        vendorOrderKey: vendor.vendorId,
        type: "PLATFORM_COMMISSION",
        amountPence: vendor.commissionPence,
      });
    }
    if (vendor.taxPence) {
      lines.push({
        vendorId: vendor.vendorId,
        vendorOrderKey: vendor.vendorId,
        type: "TAX_RECORDED",
        amountPence: vendor.taxPence,
      });
    }
  }
  return lines;
}

export function releaseLedger(vendor: Pick<VendorAllocation, "vendorId" | "productProceedsPence" | "shippingPence">, disputed: boolean) {
  if (disputed) return [];
  return [
    {
      vendorId: vendor.vendorId,
      vendorOrderKey: vendor.vendorId,
      type: "AVAILABLE_EARNING",
      amountPence: vendor.productProceedsPence,
    },
    {
      vendorId: vendor.vendorId,
      vendorOrderKey: vendor.vendorId,
      type: "SHIPPING_AVAILABLE",
      amountPence: vendor.shippingPence,
    },
  ];
}

export function refundAdjustment(input: {
  productRefundPence: number;
  shippingRefundPence?: number;
  commissionBps: number;
}) {
  const productRefundPence = Math.max(0, input.productRefundPence);
  const shippingRefundPence = Math.max(0, input.shippingRefundPence ?? 0);
  const commissionReversalPence = applyBps(productRefundPence, input.commissionBps);
  const vendorDeductionPence = productRefundPence - commissionReversalPence + shippingRefundPence;
  return {
    productRefundPence,
    shippingRefundPence,
    commissionReversalPence,
    vendorDeductionPence,
    buyerRefundPence: productRefundPence + shippingRefundPence,
  };
}

const VENDOR_CASH_IGNORED = new Set(["PLATFORM_COMMISSION", "COMMISSION_REVERSAL", "TAX_RECORDED"]);

export function balancesFromLines(lines: SettlementLine[], reservedPence = 0) {
  let productPending = 0;
  let shippingPending = 0;
  let productAvailable = 0;
  let shippingAvailable = 0;
  let payouts = 0;
  let refunds = 0;
  let holds = 0;
  let releasedHolds = 0;
  let commission = 0;
  for (const line of lines) {
    if (VENDOR_CASH_IGNORED.has(line.type)) {
      if (line.type === "PLATFORM_COMMISSION") commission += line.amountPence;
      if (line.type === "COMMISSION_REVERSAL") commission -= line.amountPence;
      continue;
    }
    if (line.type === "PENDING_EARNING") productPending += line.amountPence;
    if (line.type === "SHIPPING_ALLOCATION") shippingPending += line.amountPence;
    if (line.type === "AVAILABLE_EARNING") productAvailable += line.amountPence;
    if (line.type === "SHIPPING_AVAILABLE") shippingAvailable += line.amountPence;
    if (line.type === "PAYOUT") payouts += line.amountPence;
    if (line.type === "REFUND_DEDUCTION") refunds += line.amountPence;
    if (line.type === "HOLD") holds += line.amountPence;
    if (line.type === "RELEASE_HOLD") releasedHolds += line.amountPence;
  }
  const hold = Math.max(0, holds - releasedHolds);
  const pendingPence = Math.max(0, productPending + shippingPending - productAvailable - shippingAvailable - hold);
  const availablePence = Math.max(0, productAvailable + shippingAvailable - payouts - refunds - reservedPence - hold);
  return {
    productProceedsPence: productPending,
    shippingPence: shippingPending,
    commissionPence: commission,
    refundsPence: refunds,
    pendingPence,
    availablePence,
    heldPence: hold,
    withdrawnPence: payouts,
  };
}

/** Original payment split. Refunds are checked separately and must not change this remainder. */
export function ledgerDifference(paymentPence: number, lines: SettlementLine[], taxPence: number) {
  const sum = (type: string) => lines.filter((line) => line.type === type).reduce((total, line) => total + line.amountPence, 0);
  const vendor = sum("PENDING_EARNING") + sum("SHIPPING_ALLOCATION");
  const commission = sum("PLATFORM_COMMISSION");
  return paymentPence - (vendor + commission + taxPence);
}

export function canRecordPayment(existingId: string | null | undefined) {
  return !existingId;
}

export function canCompletePayout(status: string) {
  return status !== "COMPLETED" && status !== "REJECTED";
}

export function ownsVendorRecord(actorVendorId: string | null | undefined, recordVendorId: string) {
  return Boolean(actorVendorId) && actorVendorId === recordVendorId;
}
