import {
  ALLOCATION_VERSION,
  allocateOrder,
  balancesFromLines,
  canCompletePayout,
  canRecordPayment,
  canReleaseToWallet,
  chooseShippingQuote,
  coveredCommissionBps,
  quotedShippingPrice,
  refundAdjustment,
  type VendorChargeInput,
} from "./allocation";
import { prisma } from "./db";
import { applyBps, SETTLEMENT_DELAY_DAYS } from "./money";
import { orderNumber, methodServesPostcode } from "./utils";
import { notify, audit } from "./audit";
import { postWalletEntry, WALLET_REFUND } from "./wallet";
import { getSetting } from "./settings";
import { listingLimitReached } from "./listings";

export { listingLimitReached };

export class CommerceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommerceError";
  }
}

export async function getActivePlanForVendor(vendorId: string) {
  const sub = await prisma.vendorSubscription.findFirst({
    where: { vendorId, status: { in: ["ACTIVE", "GRACE"] } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (sub) return sub.plan;
  return prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
}

export async function countActiveListings(vendorId: string) {
  return prisma.product.count({
    where: { vendorId, status: { in: ["PUBLISHED", "PENDING_REVIEW"] } },
  });
}

export async function assertListingLimit(vendorId: string) {
  const plan = await getActivePlanForVendor(vendorId);
  const count = await countActiveListings(vendorId);
  if (listingLimitReached(count, plan.maxActiveProducts)) {
    throw new CommerceError(
      `Your ${plan.name} plan allows ${plan.maxActiveProducts} active listings. Upgrade to publish more. Existing listings were not deleted.`,
    );
  }
  return plan;
}

export async function vendorHasChosenPlan(vendorId: string) {
  const chosen = await prisma.billingEvent.findFirst({
    where: { type: "SUBSCRIBE", subscription: { vendorId } },
    select: { id: true },
  });
  return Boolean(chosen);
}

export async function trimPublishedListings(vendorId: string, maxActiveProducts: number | null) {
  if (maxActiveProducts == null) return { deactivated: 0, kept: 0 };
  const published = await prisma.product.findMany({
    where: { vendorId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  const excess = published.slice(maxActiveProducts);
  if (excess.length) {
    await prisma.product.updateMany({
      where: { id: { in: excess.map((product) => product.id) } },
      data: { status: "DRAFT" },
    });
  }
  return { deactivated: excess.length, kept: Math.min(published.length, maxActiveProducts) };
}

export async function applySubscriptionDowngrade(vendorId: string) {
  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
  return trimPublishedListings(vendorId, plan.maxActiveProducts ?? 5);
}

export async function shippingQuote(vendorId: string, postcode: string, subtotalPence: number) {
  const methods = await prisma.shippingMethod.findMany({
    where: { enabled: true, OR: [{ vendorId }, { vendorId: null }] },
    include: { zone: true },
  });
  const eligible = methods.filter(
    (m) => m.zone.enabled && methodServesPostcode(m.zone.postcodePrefixes, postcode),
  );
  if (!eligible.length) {
    throw new CommerceError(`No shipping method serves ${postcode} for this vendor.`);
  }
  return eligible.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    carrier: m.carrier,
    minDays: m.minDays,
    maxDays: m.maxDays,
    pricePence: quotedShippingPrice(m.pricePence, m.freeAbovePence, subtotalPence),
  }));
}

export async function adjustStock(variantId: string, delta: number, reason: string, note?: string) {
  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: delta } },
    });
    if (variant.stock < 0) {
      throw new CommerceError("Insufficient stock for this item.");
    }
    await tx.inventoryMovement.create({
      data: { variantId, delta, reason, note },
    });
  });
}

type CheckoutInput = {
  userId: string;
  cartId: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostcode: string;
  shippingCountry?: string;
  couponCode?: string;
  shippingMethodIds?: Record<string, string>;
};

export async function createOrderFromCart(input: CheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { id: input.cartId },
    include: {
      items: {
        include: {
          product: { include: { vendor: true, variants: true } },
          variant: true,
        },
      },
    },
  });
  if (!cart || cart.userId !== input.userId || !cart.items.length) {
    throw new CommerceError("Your cart is empty.");
  }

  const vatBps = Number(await getSetting("vatBps")) || 0;
  const vatMode = await getSetting("vatMode");

  const grouped = new Map<string, typeof cart.items>();
  for (const item of cart.items) {
    if (item.product.status !== "PUBLISHED") {
      throw new CommerceError(`${item.product.name} is no longer available.`);
    }
    if (!item.product.vendor.canAcceptOrders || item.product.vendor.status !== "ACTIVE") {
      throw new CommerceError(`${item.product.vendor.storeName} cannot accept orders right now.`);
    }
    const list = grouped.get(item.product.vendorId) ?? [];
    list.push(item);
    grouped.set(item.product.vendorId, list);
  }

  const prepared: {
    vendorId: string;
    vendorName: string;
    subtotal: number;
    items: { productId: string; variantId: string; name: string; sku: string | null; qty: number; unit: number }[];
    charge: VendorChargeInput;
  }[] = [];

  for (const [vendorId, items] of grouped) {
    let subtotal = 0;
    const mapped = [];
    for (const item of items) {
      const variant = item.variant ?? item.product.variants[0];
      if (!variant) throw new CommerceError(`${item.product.name} has no purchasable variant.`);
      const unit = variant.pricePence ?? item.product.salePricePence ?? item.product.pricePence;
      subtotal += unit * item.quantity;
      mapped.push({
        productId: item.productId,
        variantId: variant.id,
        name: item.product.name,
        sku: variant.sku ?? item.product.sku,
        qty: item.quantity,
        unit,
      });
    }
    const quotes = await shippingQuote(vendorId, input.shippingPostcode, subtotal);
    let selected;
    try {
      selected = chooseShippingQuote(quotes, input.shippingMethodIds?.[vendorId]);
    } catch (error) {
      throw new CommerceError(error instanceof Error ? error.message : "Delivery is not available.");
    }
    const plan = await getActivePlanForVendor(vendorId);
    const premium = coveredCommissionBps(plan) === 0 && plan.key !== "free";
    prepared.push({
      vendorId,
      vendorName: items[0]?.product.vendor.storeName ?? "Vendor",
      subtotal,
      items: mapped,
      charge: {
        vendorId,
        vendorName: items[0]?.product.vendor.storeName ?? "Vendor",
        productSubtotalPence: subtotal,
        shippingPence: selected.pricePence,
        shippingMethodId: selected.id,
        shippingMethodName: selected.name,
        shippingMethodCode: selected.code,
        premium,
        taxPence: 0,
      },
    });
  }

  const orderSubtotal = prepared.reduce((sum, group) => sum + group.subtotal, 0);
  let discount = 0;
  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    if (
      coupon &&
      coupon.enabled &&
      (!coupon.startsAt || coupon.startsAt <= new Date()) &&
      (!coupon.endsAt || coupon.endsAt >= new Date()) &&
      orderSubtotal >= coupon.minSubtotalPence
    ) {
      discount = coupon.type === "PERCENT" ? applyBps(orderSubtotal, coupon.value) : Math.min(coupon.value, orderSubtotal);
    }
  }
  const vatRate = vatMode ? vatBps : 0;
  const allocation = allocateOrder(
    prepared.map((group) => ({
      ...group.charge,
      taxPence: applyBps(group.subtotal, vatRate),
    })),
    discount,
  );
  if (allocation.differencePence !== 0) {
    throw new CommerceError("This checkout could not be reconciled.");
  }

  return prisma.$transaction(async (tx) => {
    for (const group of prepared) {
      for (const item of group.items) {
        const locked = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.qty } },
        });
        if (locked.stock < 0) throw new CommerceError(`Not enough stock for ${item.name}.`);
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            delta: -item.qty,
            reason: "ORDER_RESERVE",
          },
        });
      }
    }

    const order = await tx.order.create({
      data: {
        number: orderNumber(),
        userId: input.userId,
        status: "PENDING_PAYMENT",
        subtotalPence: allocation.subtotalPence,
        shippingPence: allocation.shippingPence,
        taxPence: allocation.taxPence,
        discountPence: allocation.discountPence,
        totalPence: allocation.paymentPence,
        paymentStatus: "UNPAID",
        shippingName: input.shippingName,
        shippingLine1: input.shippingLine1,
        shippingCity: input.shippingCity,
        shippingRegion: input.shippingRegion,
        shippingPostcode: input.shippingPostcode,
        shippingCountry: input.shippingCountry ?? "GB",
        vendorOrders: {
          create: allocation.vendors.map((vendor) => {
            const group = prepared.find((row) => row.vendorId === vendor.vendorId);
            return {
              vendorId: vendor.vendorId,
              status: "AWAITING_PAYMENT",
              subtotalPence: vendor.productSubtotalPence,
              shippingPence: vendor.shippingPence,
              taxPence: vendor.taxPence,
              discountPence: vendor.discountPence,
              commissionBps: vendor.commissionBps,
              commissionPence: vendor.commissionPence,
              vendorNetPence: vendor.vendorPence,
              allocationVersion: ALLOCATION_VERSION,
              shippingMethodName: vendor.shippingMethodName,
              shippingMethodCode: vendor.shippingMethodCode,
              items: {
                create: (group?.items ?? []).map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  nameSnapshot: item.name,
                  skuSnapshot: item.sku,
                  quantity: item.qty,
                  unitPence: item.unit,
                  totalPence: item.unit * item.qty,
                })),
              },
            };
          }),
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return order;
  }, { timeout: 15000 });
}

export async function confirmPayment(orderId: string, providerRef: string, idempotencyKey: string) {
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (!canRecordPayment(existing?.id)) return existing;

  let result: { payment: { id: string } | undefined; order: { userId: string; number: string; id: string }; duplicate: boolean };
  try {
    result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { vendorOrders: true, user: true, payments: true },
    });
    if (!order) throw new CommerceError("Order not found");
    if (order.paymentStatus === "PAID" || order.payments.length) {
      return { payment: order.payments[0], order, duplicate: true };
    }
    const payment = await tx.payment.create({
      data: {
        orderId,
        provider: process.env.PAYMENT_PROVIDER ?? "sandbox",
        providerRef,
        amountPence: order.totalPence,
        status: "SUCCEEDED",
        idempotencyKey,
      },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentStatus: "PAID" },
    });
    for (const vo of order.vendorOrders) {
      await tx.vendorOrder.update({
        where: { id: vo.id },
        data: { status: "NEW" },
      });
      const current = vo.allocationVersion >= ALLOCATION_VERSION;
      const productProceeds = current ? vo.vendorNetPence - vo.shippingPence : vo.vendorNetPence;
      const shipping = current ? vo.shippingPence : 0;
      await tx.ledgerEntry.create({
        data: {
          vendorId: vo.vendorId,
          vendorOrderId: vo.id,
          type: "PENDING_EARNING",
          amountPence: productProceeds,
          note: `Product proceeds ${order.number}`,
        },
      });
      if (current) {
        await tx.ledgerEntry.create({
          data: {
            vendorId: vo.vendorId,
            vendorOrderId: vo.id,
            type: "SHIPPING_ALLOCATION",
            amountPence: shipping,
            note: `Shipping ${order.number}`,
          },
        });
      }
      if (vo.commissionPence > 0) {
        await tx.ledgerEntry.create({
          data: {
            vendorId: vo.vendorId,
            vendorOrderId: vo.id,
            type: "PLATFORM_COMMISSION",
            amountPence: vo.commissionPence,
            note: `Commission ${order.number}`,
          },
        });
      }
    }
    return { payment, order, duplicate: false };
  });
  } catch (error) {
    const again = await prisma.payment.findUnique({ where: { idempotencyKey } });
    if (again) return again;
    throw error;
  }
  if (!result.duplicate && result.order) {
    await notify(
      result.order.userId,
      "Order confirmed",
      `Payment received for ${result.order.number}.`,
      `/account/orders/${result.order.id}`,
    );
  }
  return result.payment;
}

export async function markDelivered(vendorOrderId: string, actorId: string) {
  const vo = await prisma.vendorOrder.update({
    where: { id: vendorOrderId },
    data: { deliveredAt: new Date(), status: "DELIVERED" },
    include: { order: true },
  });
  await audit({
    actorId,
    action: "order.delivered",
    entity: "VendorOrder",
    entityId: vendorOrderId,
  });
  await notify(
    vo.order.userId,
    "Order delivered",
    `A shipment on ${vo.order.number} was marked delivered.`,
    `/account/orders/${vo.orderId}`,
  );
  return vo;
}

export async function confirmCustomerDelivery(vendorOrderId: string, userId: string) {
  const vo = await prisma.vendorOrder.findUnique({
    where: { id: vendorOrderId },
    include: { order: true },
  });
  if (!vo || vo.order.userId !== userId) throw new CommerceError("Order not found");
  return prisma.vendorOrder.update({
    where: { id: vendorOrderId },
    data: { customerConfirmedAt: new Date() },
  });
}

export async function releaseEligibleEarnings(now = new Date()) {
  const delayDays = Number(await getSetting("settlementDelayDays")) || SETTLEMENT_DELAY_DAYS;
  const candidates = await prisma.vendorOrder.findMany({
    where: {
      settlementAt: null,
      status: { notIn: ["AWAITING_PAYMENT", "CANCELLED"] },
      order: { paymentStatus: "PAID" },
    },
    include: { order: true, disputes: { where: { status: { in: ["OPEN", "INVESTIGATING"] } }, select: { id: true } } },
  });
  let released = 0;
  for (const vo of candidates) {
    if (
      !canReleaseToWallet({
        paid: true,
        settled: false,
        openDispute: vo.disputes.length > 0,
        placedAt: vo.order.placedAt,
        customerConfirmedAt: vo.customerConfirmedAt,
        now,
        delayDays,
      })
    ) {
      continue;
    }
    const current = vo.allocationVersion >= ALLOCATION_VERSION;
    const productProceeds = current ? vo.vendorNetPence - vo.shippingPence : vo.vendorNetPence;
    const claimed = await prisma.vendorOrder.updateMany({
      where: { id: vo.id, settlementAt: null },
      data: {
        settlementAt: new Date(),
        ...(vo.status === "DELIVERED" ? { status: "SETTLED" } : {}),
      },
    });
    if (!claimed.count) continue;
    released += 1;
    await prisma.ledgerEntry.create({
      data: {
        vendorId: vo.vendorId,
        vendorOrderId: vo.id,
        type: "AVAILABLE_EARNING",
        amountPence: productProceeds,
        availableAt: new Date(),
        note: "Product proceeds released",
      },
    });
    if (current) {
      await prisma.ledgerEntry.create({
        data: {
          vendorId: vo.vendorId,
          vendorOrderId: vo.id,
          type: "SHIPPING_AVAILABLE",
          amountPence: vo.shippingPence,
          availableAt: new Date(),
          note: "Shipping fee released",
        },
      });
    }
  }
  return released;
}

export async function vendorBalances(vendorId: string) {
  await releaseEligibleEarnings();
  const entries = await prisma.ledgerEntry.findMany({ where: { vendorId } });
  const openWithdrawals = await prisma.withdrawalRequest.aggregate({
    where: { vendorId, status: { in: ["PENDING", "PROCESSING"] } },
    _sum: { amountPence: true },
  });
  return balancesFromLines(
    entries.map((entry) => ({
      vendorId: entry.vendorId,
      vendorOrderKey: entry.vendorOrderId ?? entry.vendorId,
      type: entry.type,
      amountPence: entry.amountPence,
    })),
    openWithdrawals._sum.amountPence ?? 0,
  );
}

export async function requestWithdrawal(vendorId: string, amountPence: number) {
  if (amountPence <= 0) throw new CommerceError("Enter a positive amount.");
  await releaseEligibleEarnings();
  return prisma.$transaction(async (tx) => {
    const method =
      (await tx.payoutMethod.findFirst({ where: { vendorId, isDefault: true } })) ??
      (await tx.payoutMethod.findFirst({ where: { vendorId } }));
    if (!method) throw new CommerceError("Add the bank account withdrawals should be paid to.");
    const entries = await tx.ledgerEntry.findMany({ where: { vendorId } });
    const open = await tx.withdrawalRequest.aggregate({
      where: { vendorId, status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { amountPence: true },
    });
    const { availablePence } = balancesFromLines(
      entries.map((entry) => ({
        vendorId,
        vendorOrderKey: entry.vendorOrderId ?? vendorId,
        type: entry.type,
        amountPence: entry.amountPence,
      })),
      open._sum.amountPence ?? 0,
    );
    if (amountPence > availablePence) {
      throw new CommerceError("That amount is still in the 7-day hold, or it is more than your wallet can pay out.");
    }
    const payout = await tx.withdrawalRequest.create({
      data: {
        vendorId,
        amountPence,
        status: "COMPLETED",
        processedAt: new Date(),
        reason: `Paid to ${method.label}`,
      },
    });
    await tx.ledgerEntry.create({
      data: {
        vendorId,
        type: "PAYOUT",
        amountPence,
        note: `Withdrawal to ${method.label}`,
      },
    });
    return payout;
  });
}

export async function releaseDisputeHold(vendorOrderId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { vendorOrderId, type: { in: ["HOLD", "RELEASE_HOLD"] } },
  });
  const open = entries.reduce((sum, entry) => sum + (entry.type === "HOLD" ? entry.amountPence : -entry.amountPence), 0);
  if (open <= 0) return;
  const vendorId = entries[0]?.vendorId;
  if (!vendorId) return;
  await prisma.ledgerEntry.create({
    data: {
      vendorId,
      vendorOrderId,
      type: "RELEASE_HOLD",
      amountPence: open,
      note: "Dispute hold released",
    },
  });
}

export async function refundVendorOrder(input: {
  vendorOrderId: string;
  productRefundPence: number;
  shippingRefundPence?: number;
  reason: string;
  idempotencyKey: string;
  disputeId?: string;
}) {
  const existing = await prisma.refund.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;
  try {
    return await prisma.$transaction(async (tx) => {
      const vo = await tx.vendorOrder.findUnique({
        where: { id: input.vendorOrderId },
        include: { order: { select: { userId: true, number: true } } },
      });
      if (!vo) throw new CommerceError("Vendor order not found.");
      const current = vo.allocationVersion >= ALLOCATION_VERSION;
      const eligibleProduct = current ? vo.subtotalPence - vo.discountPence : vo.subtotalPence;
      const productRefund = Math.min(Math.max(0, input.productRefundPence), Math.max(0, eligibleProduct));
      const shippingRefund = current ? Math.min(Math.max(0, input.shippingRefundPence ?? 0), vo.shippingPence) : 0;
      const adjustment = refundAdjustment({
        productRefundPence: productRefund,
        shippingRefundPence: shippingRefund,
        commissionBps: vo.commissionBps,
      });
      const refund = await tx.refund.create({
        data: {
          disputeId: input.disputeId,
          orderId: vo.orderId,
          vendorOrderId: vo.id,
          amountPence: adjustment.buyerRefundPence,
          productPence: adjustment.productRefundPence,
          shippingPence: adjustment.shippingRefundPence,
          commissionReversalPence: adjustment.commissionReversalPence,
          status: "APPROVED",
          reason: input.reason,
          idempotencyKey: input.idempotencyKey,
        },
      });
      if (adjustment.vendorDeductionPence) {
        await tx.ledgerEntry.create({
          data: {
            vendorId: vo.vendorId,
            vendorOrderId: vo.id,
            type: "REFUND_DEDUCTION",
            amountPence: adjustment.vendorDeductionPence,
            note: input.reason,
          },
        });
      }
      if (adjustment.commissionReversalPence) {
        await tx.ledgerEntry.create({
          data: {
            vendorId: vo.vendorId,
            vendorOrderId: vo.id,
            type: "COMMISSION_REVERSAL",
            amountPence: adjustment.commissionReversalPence,
            note: input.reason,
          },
        });
      }
      if (adjustment.buyerRefundPence > 0) {
        await postWalletEntry(tx, {
          userId: vo.order.userId,
          type: WALLET_REFUND,
          amountPence: adjustment.buyerRefundPence,
          orderId: vo.orderId,
          idempotencyKey: `wallet_${input.idempotencyKey}`,
          note: `Refund for ${vo.order.number}`,
        });
      }
      return refund;
    });
  } catch (error) {
    const again = await prisma.refund.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (again) return again;
    throw error;
  }
}

export async function completePayout(id: string, status: string, reviewedBy: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.withdrawalRequest.findUnique({ where: { id } });
    if (!current) throw new CommerceError("Payout not found.");
    if (!canCompletePayout(current.status)) return current;
    const claimed = await tx.withdrawalRequest.updateMany({
      where: { id, status: current.status },
      data: { status, reason, reviewedBy, processedAt: new Date() },
    });
    if (!claimed.count) return current;
    if (status === "COMPLETED") {
      await tx.ledgerEntry.create({
        data: {
          vendorId: current.vendorId,
          type: "PAYOUT",
          amountPence: current.amountPence,
          note: `Withdrawal ${current.id}`,
        },
      });
    }
    return tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
  });
}
