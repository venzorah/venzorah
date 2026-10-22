"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkoutActor, isDemoActor } from "@/lib/checkout-actor";
import { clearCheckoutDraft, readCheckoutDraft, writeCheckoutReceipt } from "@/lib/checkout-draft";
import { CommerceError, confirmPayment, createOrderFromCart } from "@/lib/commerce";
import { clearDemoCart } from "@/lib/demo-cart";
import { assessDemoCard } from "@/lib/demo-stripe";
import { parseGbpToPence } from "@/lib/money";
import { orderNumber } from "@/lib/utils";
import { buyerBalancePence, normaliseUkBank, postWalletEntry, WALLET_PAYOUT, WALLET_PURCHASE, WALLET_TOP_UP, WalletError } from "@/lib/wallet";

const TOP_UP_LIMIT_PENCE = 200_000;

function walletError(error: unknown, fallback: string) {
  if (error instanceof WalletError || error instanceof CommerceError) return { error: error.message };
  return { error: fallback };
}

export async function fundWalletAction(formData: FormData) {
  const user = await requireUser();
  const card = assessDemoCard(
    String(formData.get("cardNumber") ?? ""),
    String(formData.get("cardExpiry") ?? ""),
    String(formData.get("cardCvc") ?? ""),
  );
  if (!card.ok) return { error: card.error };
  let amountPence = 0;
  try {
    amountPence = parseGbpToPence(String(formData.get("amount") ?? ""));
  } catch {
    return { error: "Enter a valid amount in pounds." };
  }
  if (amountPence <= 0 || amountPence > TOP_UP_LIMIT_PENCE) {
    return { error: "Add between £0.01 and £2,000 at a time." };
  }
  try {
    await prisma.$transaction((tx) =>
      postWalletEntry(tx, {
        userId: user.id,
        type: WALLET_TOP_UP,
        amountPence,
        note: "Wallet top-up",
      }),
    );
  } catch (error) {
    return walletError(error, "The wallet could not be funded.");
  }
  revalidatePath("/account/wallet");
  revalidatePath("/account");
}

export async function saveBuyerBankAction(formData: FormData) {
  const user = await requireUser();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const bank = normaliseUkBank(String(formData.get("sortCode") ?? ""), String(formData.get("accountNumber") ?? ""));
  if (accountName.length < 2 || !bank) {
    return { error: "Enter the account name, a 6-digit sort code and an 8-digit account number." };
  }
  await prisma.buyerPayoutDetail.upsert({
    where: { userId: user.id },
    create: { userId: user.id, accountName, sortCode: bank.sortCode, accountNumber: bank.accountNumber },
    update: { accountName, sortCode: bank.sortCode, accountNumber: bank.accountNumber },
  });
  revalidatePath("/account/wallet");
}

export async function requestBuyerPayoutAction(formData: FormData) {
  const user = await requireUser();
  let amountPence = 0;
  try {
    amountPence = parseGbpToPence(String(formData.get("amount") ?? ""));
  } catch {
    return { error: "Enter a valid amount in pounds." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      const detail = await tx.buyerPayoutDetail.findUnique({ where: { userId: user.id } });
      if (!detail) throw new WalletError("Add the bank account payouts should be paid to.");
      await postWalletEntry(tx, {
        userId: user.id,
        type: WALLET_PAYOUT,
        amountPence,
        note: `Payout to ${detail.accountName}`,
      });
      await tx.buyerPayout.create({
        data: {
          userId: user.id,
          amountPence,
          status: "COMPLETED",
          accountName: detail.accountName,
          sortCode: detail.sortCode,
          accountLast4: detail.accountNumber.slice(-4),
          processedAt: new Date(),
        },
      });
    });
  } catch (error) {
    return walletError(error, "The payout could not be completed.");
  }
  revalidatePath("/account/wallet");
  revalidatePath("/account");
}

export async function payWithWallet(_formData: FormData) {
  const user = await checkoutActor();
  if (!user) redirect("/login?next=/checkout/pay");
  if (isDemoActor(user)) return { error: "Sign in with your account to pay from a wallet." };
  const draft = await readCheckoutDraft();
  if (!draft || draft.userId !== user.id || !draft.cartId) {
    return { error: "This checkout has expired. Go back to your cart and start again." };
  }
  let orderId: string | undefined;
  let number = orderNumber();
  let subtotalPence = draft.subtotalPence;
  let shippingPence = draft.shippingPence;
  let taxPence = draft.taxPence ?? 0;
  let totalPence = draft.totalPence;
  try {
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
    orderId = order.id;
    number = order.number;
    subtotalPence = order.subtotalPence;
    shippingPence = order.shippingPence;
    taxPence = order.taxPence;
    totalPence = order.totalPence;
    await prisma.$transaction((tx) =>
      postWalletEntry(tx, {
        userId: user.id,
        type: WALLET_PURCHASE,
        amountPence: order.totalPence,
        orderId: order.id,
        idempotencyKey: `wallet_pay_${order.id}`,
        note: `Order ${order.number}`,
      }),
    );
    await confirmPayment(order.id, `wallet_${order.id}`, `wallet_${order.id}`);
    if (draft.demoProductIds.length) await clearDemoCart();
  } catch (error) {
    if (orderId) {
      const paid = await prisma.payment.findUnique({ where: { idempotencyKey: `wallet_${orderId}` } });
      if (!paid) {
        await prisma.buyerWalletEntry.deleteMany({ where: { idempotencyKey: `wallet_pay_${orderId}` } }).catch(() => undefined);
      }
    }
    return walletError(error, "Wallet payment could not be completed.");
  }
  await writeCheckoutReceipt({ number, orderId, lines: draft.lines, subtotalPence, shippingPence, taxPence, totalPence });
  await clearCheckoutDraft();
  revalidatePath("/account/wallet");
  redirect("/checkout/complete");
}

export async function buyerBalanceFor(userId: string) {
  const entries = await prisma.buyerWalletEntry.findMany({ where: { userId } });
  return buyerBalancePence(entries);
}
