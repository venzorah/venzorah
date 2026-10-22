import { cookies } from "next/headers";
import { readPayload, signPayload } from "./signed-payload";

const DRAFT_COOKIE = "venzorah_checkout_draft";
const RECEIPT_COOKIE = "venzorah_checkout_receipt";
const DRAFT_TTL_MS = 30 * 60 * 1000;
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

export type CheckoutLine = {
  name: string;
  vendor: string;
  quantity: number;
  unitPence: number;
};

export type CheckoutVendorQuote = {
  vendorId: string;
  name: string;
  productSubtotalPence: number;
  discountPence: number;
  shippingPence: number;
  shippingMethodId: string;
  shippingMethodName: string;
  shippingMethodCode: string;
  methods: { id: string; name: string; code: string; pricePence: number }[];
};

export type CheckoutDraft = {
  userId: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostcode: string;
  coupon?: string;
  cartId?: string;
  demoProductIds: { productId: string; quantity: number }[];
  lines: CheckoutLine[];
  vendors?: CheckoutVendorQuote[];
  subtotalPence: number;
  shippingPence: number;
  discountPence?: number;
  taxPence: number;
  totalPence: number;
};

export type CheckoutReceipt = {
  number: string;
  orderId?: string;
  lines: CheckoutLine[];
  subtotalPence: number;
  shippingPence: number;
  taxPence: number;
  totalPence: number;
};

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function writeCheckoutDraft(draft: CheckoutDraft) {
  const jar = await cookies();
  jar.set(DRAFT_COOKIE, signPayload("draft", draft, DRAFT_TTL_MS), cookieOptions(Math.floor(DRAFT_TTL_MS / 1000)));
}

export async function readCheckoutDraft() {
  const jar = await cookies();
  const token = jar.get(DRAFT_COOKIE)?.value;
  if (!token) return null;
  return readPayload<CheckoutDraft>(token, "draft");
}

export async function clearCheckoutDraft() {
  const jar = await cookies();
  jar.delete(DRAFT_COOKIE);
}

export async function writeCheckoutReceipt(receipt: CheckoutReceipt) {
  const jar = await cookies();
  jar.set(
    RECEIPT_COOKIE,
    signPayload("receipt", receipt, RECEIPT_TTL_MS),
    cookieOptions(Math.floor(RECEIPT_TTL_MS / 1000)),
  );
}

export async function readCheckoutReceipt() {
  const jar = await cookies();
  const token = jar.get(RECEIPT_COOKIE)?.value;
  if (!token) return null;
  return readPayload<CheckoutReceipt>(token, "receipt");
}
