"use server";

import { redirect } from "next/navigation";
import { checkoutActor, isDemoActor } from "@/lib/checkout-actor";
import { clearCheckoutDraft, readCheckoutDraft, writeCheckoutReceipt } from "@/lib/checkout-draft";
import { CommerceError, confirmPayment, createOrderFromCart } from "@/lib/commerce";
import { clearDemoCart } from "@/lib/demo-cart";
import { assessDemoCard } from "@/lib/demo-stripe";
import { orderNumber } from "@/lib/utils";

export async function payWithDemoStripe(formData: FormData) {
  const user = await checkoutActor();
  if (!user) redirect("/login?next=/checkout");
  const draft = await readCheckoutDraft();
  if (!draft || draft.userId !== user.id) {
    return { error: "This checkout has expired. Go back to your cart and start again." };
  }
  const card = assessDemoCard(
    String(formData.get("cardNumber") ?? ""),
    String(formData.get("cardExpiry") ?? ""),
    String(formData.get("cardCvc") ?? ""),
  );
  if (!card.ok) return { error: card.error };

  let orderId: string | undefined;
  let number = orderNumber();
  let subtotalPence = draft.subtotalPence;
  let shippingPence = draft.shippingPence;
  let taxPence = draft.taxPence ?? 0;
  let totalPence = draft.totalPence;
  try {
    if (draft.cartId && !isDemoActor(user)) {
      const order = await createOrderFromCart({
        userId: user.id,
        cartId: draft.cartId,
        shippingName: draft.shippingName,
        shippingLine1: draft.shippingLine1,
        shippingCity: draft.shippingCity,
        shippingRegion: draft.shippingRegion,
        shippingPostcode: draft.shippingPostcode,
        couponCode: draft.coupon,
        shippingMethodIds: Object.fromEntries((draft.vendors ?? []).map((vendor) => [vendor.vendorId, vendor.shippingMethodId])),
      });
      await confirmPayment(order.id, `demo_stripe_${order.id}`, `demo_stripe_${order.id}`);
      orderId = order.id;
      number = order.number;
      if (!draft.demoProductIds.length) {
        subtotalPence = order.subtotalPence;
        shippingPence = order.shippingPence;
        taxPence = order.taxPence;
        totalPence = order.totalPence;
      }
    }
    if (draft.demoProductIds.length) await clearDemoCart();
  } catch (error) {
    console.error("[checkout] demo stripe payment failed", error instanceof Error ? error.message : error);
    return { error: error instanceof CommerceError ? error.message : "Payment could not be completed." };
  }

  await writeCheckoutReceipt({
    number,
    orderId,
    lines: draft.lines,
    subtotalPence,
    shippingPence,
    taxPence,
    totalPence,
  });
  await clearCheckoutDraft();
  return { ok: true as const };
}
