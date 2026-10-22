import { allocateOrder, chooseShippingQuote, coveredCommissionBps } from "./allocation";
import { prisma } from "./db";
import { CommerceError, getActivePlanForVendor, shippingQuote } from "./commerce";
import type { AuthUser } from "./auth";
import { isDemoActor } from "./checkout-actor";
import type { CheckoutDraft, CheckoutLine, CheckoutVendorQuote } from "./checkout-draft";
import { demoCartLines, demoCartTotals } from "./demo-cart";
import { readGuestCart, clearGuestCart } from "./guest-cart";
import { applyBps } from "./money";
import { getSetting } from "./settings";

export type StoreLine = CheckoutLine & { id: string; source: "database" | "demo" };

async function databaseCart(userId: string) {
  return prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { product: { include: { vendor: true } }, variant: true } } },
  });
}

export async function guestCartLines(): Promise<StoreLine[]> {
  const items = await readGuestCart();
  return items.map((item) => ({
    id: `guest:${item.productId}`,
    name: item.name,
    vendor: item.vendor,
    quantity: item.quantity,
    unitPence: item.unitPence,
    source: "database" as const,
  }));
}

export async function mergeGuestCart(userId: string) {
  const items = await readGuestCart();
  if (!items.length) return;
  const existing = await prisma.cart.findFirst({ where: { userId } });
  const cart = existing ?? (await prisma.cart.create({ data: { userId } }));
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!product || product.status !== "PUBLISHED" || !variant || variant.productId !== product.id) continue;
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: { cartId: cart.id, productId: product.id, variantId: variant.id },
      },
      update: { quantity: { increment: item.quantity } },
      create: { cartId: cart.id, productId: product.id, variantId: variant.id, quantity: item.quantity },
    });
  }
  await clearGuestCart();
}

export async function storeCartLines(user: AuthUser | null): Promise<StoreLine[]> {
  const demo = await demoCartLines();
  const guest = await guestCartLines();
  if (!user || isDemoActor(user)) return [...guest, ...demo];
  try {
    const cart = await databaseCart(user.id);
    const dbLines: StoreLine[] = (cart?.items ?? []).map((item) => ({
      id: item.id,
      name: item.product.name,
      vendor: item.product.vendor.storeName,
      quantity: item.quantity,
      unitPence: item.variant.pricePence ?? item.product.salePricePence ?? item.product.pricePence,
      source: "database",
    }));
    return [...dbLines, ...guest, ...demo];
  } catch (error) {
    console.error("[cart] database cart unavailable", error instanceof Error ? error.message : error);
    return [...guest, ...demo];
  }
}

export async function buildCheckoutDraft(
  user: AuthUser,
  address: {
    shippingName: string;
    shippingLine1: string;
    shippingCity: string;
    shippingRegion?: string;
    shippingPostcode: string;
  },
  coupon?: string,
  shippingMethodIds?: Record<string, string>,
): Promise<{ error: string } | { draft: CheckoutDraft }> {
  if (!isDemoActor(user)) {
    await mergeGuestCart(user.id).catch((error) => {
      console.error("[checkout] guest basket was not merged", error instanceof Error ? error.message : error);
    });
  }
  const demo = await demoCartLines();
  const lines: CheckoutLine[] = demo.map(({ name, vendor, quantity, unitPence }) => ({
    name,
    vendor,
    quantity,
    unitPence,
  }));
  let subtotalPence = demo.reduce((sum, line) => sum + line.unitPence * line.quantity, 0);
  let shippingPence = demoCartTotals(subtotalPence).shippingPence;
  let taxPence = 0;
  let discountPence = 0;
  let cartId: string | undefined;
  let vendors: CheckoutVendorQuote[] | undefined;

  if (!isDemoActor(user)) {
    try {
      const cart = await databaseCart(user.id);
      if (cart?.items.length) {
        cartId = cart.id;
        const grouped = new Map<string, typeof cart.items>();
        for (const item of cart.items) {
          const list = grouped.get(item.product.vendorId) ?? [];
          list.push(item);
          grouped.set(item.product.vendorId, list);
        }
        const vatBps = Number(await getSetting("vatBps")) || 0;
        const vatMode = await getSetting("vatMode");
        const vatRate = vatMode ? vatBps : 0;
        const charges = [];
        const quotesByVendor = new Map<string, CheckoutVendorQuote["methods"]>();
        for (const [vendorId, items] of grouped) {
          const vendorSubtotal = items.reduce(
            (sum, item) =>
              sum + (item.variant.pricePence ?? item.product.salePricePence ?? item.product.pricePence) * item.quantity,
            0,
          );
          const quotes = await shippingQuote(vendorId, address.shippingPostcode, vendorSubtotal);
          let selected;
          try {
            selected = chooseShippingQuote(quotes, shippingMethodIds?.[vendorId]);
          } catch (error) {
            throw new CommerceError(error instanceof Error ? error.message : "Delivery is not available.");
          }
          const plan = await getActivePlanForVendor(vendorId);
          quotesByVendor.set(
            vendorId,
            quotes.map((quote) => ({ id: quote.id, name: quote.name, code: quote.code, pricePence: quote.pricePence })),
          );
          charges.push({
            vendorId,
            vendorName: items[0]?.product.vendor.storeName ?? "Vendor",
            productSubtotalPence: vendorSubtotal,
            shippingPence: selected.pricePence,
            shippingMethodId: selected.id,
            shippingMethodName: selected.name,
            shippingMethodCode: selected.code,
            premium: coveredCommissionBps(plan) === 0 && plan.key !== "free",
            taxPence: applyBps(vendorSubtotal, vatRate),
          });
          for (const item of items) {
            lines.push({
              name: item.product.name,
              vendor: item.product.vendor.storeName,
              quantity: item.quantity,
              unitPence: item.variant.pricePence ?? item.product.salePricePence ?? item.product.pricePence,
            });
          }
        }
        let dbDiscount = 0;
        if (coupon) {
          const found = await prisma.coupon.findUnique({ where: { code: coupon.toUpperCase() } });
          const dbSubtotal = charges.reduce((sum, charge) => sum + charge.productSubtotalPence, 0);
          if (
            found &&
            found.enabled &&
            (!found.startsAt || found.startsAt <= new Date()) &&
            (!found.endsAt || found.endsAt >= new Date()) &&
            dbSubtotal >= found.minSubtotalPence
          ) {
            dbDiscount = found.type === "PERCENT" ? applyBps(dbSubtotal, found.value) : Math.min(found.value, dbSubtotal);
          }
        }
        const allocation = allocateOrder(charges, dbDiscount);
        subtotalPence += allocation.subtotalPence;
        shippingPence += allocation.shippingPence;
        taxPence += allocation.taxPence;
        vendors = allocation.vendors.map((row) => ({
          vendorId: row.vendorId,
          name: row.vendorName,
          productSubtotalPence: row.productSubtotalPence,
          discountPence: row.discountPence,
          shippingPence: row.shippingPence,
          shippingMethodId: row.shippingMethodId,
          shippingMethodName: row.shippingMethodName,
          shippingMethodCode: row.shippingMethodCode,
          methods: quotesByVendor.get(row.vendorId) ?? [],
        }));
        discountPence = allocation.discountPence;
      }
    } catch (error) {
      if (error instanceof CommerceError) return { error: error.message };
      if (!demo.length) {
        console.error("[checkout] database cart unavailable", error instanceof Error ? error.message : error);
        return { error: "Checkout needs the live database for these items." };
      }
    }
  }

  if (!lines.length) return { error: "Your cart is empty." };
  return {
    draft: {
      userId: user.id,
      ...address,
      coupon,
      cartId,
      demoProductIds: demo.map((line) => ({ productId: line.id, quantity: line.quantity })),
      lines,
      vendors,
      subtotalPence,
      shippingPence,
      discountPence,
      taxPence,
      totalPence: subtotalPence + shippingPence + taxPence - discountPence,
    },
  };
}
