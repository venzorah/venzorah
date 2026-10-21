import { NextResponse } from "next/server";
import Stripe from "stripe";
import { confirmPayment } from "@/lib/commerce";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json(
      { error: "Stripe is not configured. Sandbox checkout does not use this webhook." },
      { status: 501 },
    );
  }
  const stripe = new Stripe(key);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await confirmPayment(orderId, session.id, event.id);
    }
  }
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const subId = invoice.metadata?.vendorSubscriptionId;
    if (subId) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: subId,
          type: "INVOICE_PAID",
          amountPence: invoice.amount_paid ?? 0,
          idempotencyKey: event.id,
          providerRef: invoice.id,
        },
      });
    }
  }
  return NextResponse.json({ received: true });
}
