import { prisma } from "./db";
import { applyBps, vendorNet, SETTLEMENT_DELAY_DAYS } from "./money";
import { orderNumber, methodServesPostcode } from "./utils";
import { notify, audit } from "./audit";
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

export async function applySubscriptionDowngrade(vendorId: string) {
  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
  const max = plan.maxActiveProducts ?? 5;
  const published = await prisma.product.findMany({
    where: { vendorId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  const excess = published.slice(max);
  if (excess.length) {
    await prisma.product.updateMany({
      where: { id: { in: excess.map((p) => p.id) } },
      data: { status: "DRAFT" },
    });
  }
  return { deactivated: excess.length, kept: Math.min(published.length, max) };
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
    pricePence:
      m.freeAbovePence != null && subtotalPence >= m.freeAbovePence ? 0 : m.pricePence,
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
  shippingPostcode: string;
  shippingCountry?: string;
  couponCode?: string;
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
    subtotal: number;
    shipping: number;
    tax: number;
    commissionBps: number;
    items: { productId: string; variantId: string; name: string; sku: string | null; qty: number; unit: number }[];
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
    const shipping = [...quotes].sort((a, b) => a.pricePence - b.pricePence)[0]?.pricePence ?? 0;
    const tax = applyBps(subtotal, vatMode ? vatBps : 0);
    const plan = await getActivePlanForVendor(vendorId);
    prepared.push({
      vendorId,
      subtotal,
      shipping,
      tax,
      commissionBps: plan.commissionBps,
      items: mapped,
    });
  }

  return prisma.$transaction(async (tx) => {
    let orderSubtotal = 0;
    let orderShipping = 0;
    let orderTax = 0;
    const vendorPayloads = [];

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
      vendorPayloads.push(group);
      orderSubtotal += group.subtotal;
      orderShipping += group.shipping;
      orderTax += group.tax;
    }

    let discount = 0;
    if (input.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
      if (
        coupon &&
        coupon.enabled &&
        (!coupon.startsAt || coupon.startsAt <= new Date()) &&
        (!coupon.endsAt || coupon.endsAt >= new Date()) &&
        orderSubtotal >= coupon.minSubtotalPence
      ) {
        discount =
          coupon.type === "PERCENT" ? applyBps(orderSubtotal, coupon.value) : Math.min(coupon.value, orderSubtotal);
      }
    }

    const total = Math.max(0, orderSubtotal + orderShipping + orderTax - discount);
    const order = await tx.order.create({
      data: {
        number: orderNumber(),
        userId: input.userId,
        status: "PENDING_PAYMENT",
        subtotalPence: orderSubtotal,
        shippingPence: orderShipping,
        taxPence: orderTax,
        discountPence: discount,
        totalPence: total,
        paymentStatus: "UNPAID",
        shippingName: input.shippingName,
        shippingLine1: input.shippingLine1,
        shippingCity: input.shippingCity,
        shippingPostcode: input.shippingPostcode,
        shippingCountry: input.shippingCountry ?? "GB",
        vendorOrders: {
          create: vendorPayloads.map((v) => {
            const { commissionPence, vendorNetPence } = vendorNet(v.subtotal, v.commissionBps);
            return {
              vendorId: v.vendorId,
              status: "AWAITING_PAYMENT",
              subtotalPence: v.subtotal,
              shippingPence: v.shipping,
              taxPence: v.tax,
              commissionBps: v.commissionBps,
              commissionPence,
              vendorNetPence,
              items: {
                create: v.items.map((i) => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  nameSnapshot: i.name,
                  skuSnapshot: i.sku,
                  quantity: i.qty,
                  unitPence: i.unit,
                  totalPence: i.unit * i.qty,
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
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { vendorOrders: true, user: true },
    });
    if (!order) throw new CommerceError("Order not found");
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
      await tx.ledgerEntry.create({
        data: {
          vendorId: vo.vendorId,
          vendorOrderId: vo.id,
          type: "PENDING_EARNING",
          amountPence: vo.vendorNetPence,
          note: `Order ${order.number}`,
        },
      });
    }
    return { payment, order };
  }).then(async ({ payment, order }) => {
    await notify(
      order.userId,
      "Order confirmed",
      `Payment received for ${order.number}.`,
      `/account/orders/${order.id}`,
    );
    return payment;
  });
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

export async function releaseEligibleEarnings() {
  const delayDays = Number(await getSetting("settlementDelayDays")) || SETTLEMENT_DELAY_DAYS;
  const cutoff = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000);
  const candidates = await prisma.vendorOrder.findMany({
    where: {
      status: "DELIVERED",
      settlementAt: null,
      disputes: { none: { status: { in: ["OPEN", "INVESTIGATING"] } } },
      OR: [
        { customerConfirmedAt: { not: null } },
        { deliveredAt: { lte: cutoff } },
      ],
    },
  });
  for (const vo of candidates) {
    await prisma.$transaction([
      prisma.vendorOrder.update({
        where: { id: vo.id },
        data: { settlementAt: new Date(), status: "SETTLED" },
      }),
      prisma.ledgerEntry.create({
        data: {
          vendorId: vo.vendorId,
          vendorOrderId: vo.id,
          type: "AVAILABLE_EARNING",
          amountPence: vo.vendorNetPence,
          availableAt: new Date(),
          note: "Settlement release",
        },
      }),
    ]);
  }
  return candidates.length;
}

export async function vendorBalances(vendorId: string) {
  const entries = await prisma.ledgerEntry.findMany({ where: { vendorId } });
  let pending = 0;
  let available = 0;
  let held = 0;
  let withdrawn = 0;
  for (const e of entries) {
    if (e.type === "PENDING_EARNING") pending += e.amountPence;
    if (e.type === "AVAILABLE_EARNING") available += e.amountPence;
    if (e.type === "HOLD") held += e.amountPence;
    if (e.type === "PAYOUT") withdrawn += e.amountPence;
    if (e.type === "REFUND_DEDUCTION") available -= e.amountPence;
    if (e.type === "RELEASE_HOLD") held -= e.amountPence;
  }
  const openWithdrawals = await prisma.withdrawalRequest.aggregate({
    where: { vendorId, status: { in: ["PENDING", "PROCESSING"] } },
    _sum: { amountPence: true },
  });
  const reserved = openWithdrawals._sum.amountPence ?? 0;
  return {
    pendingPence: pending,
    availablePence: Math.max(0, available - withdrawn - reserved),
    heldPence: held,
    withdrawnPence: withdrawn,
  };
}

export async function requestWithdrawal(vendorId: string, amountPence: number) {
  if (amountPence <= 0) throw new CommerceError("Enter a positive amount.");
  const { availablePence } = await vendorBalances(vendorId);
  if (amountPence > availablePence) {
    throw new CommerceError("Withdrawal exceeds eligible balance.");
  }
  return prisma.withdrawalRequest.create({
    data: { vendorId, amountPence, status: "PENDING" },
  });
}
