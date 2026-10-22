import { cookies } from "next/headers";
import { readPayload, signPayload } from "./signed-payload";

const CART_COOKIE = "venzorah_guest_cart";
const CART_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type GuestCartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  name: string;
  unitPence: number;
  vendor: string;
};

function normalize(items: GuestCartItem[]) {
  const merged = new Map<string, GuestCartItem>();
  for (const item of items) {
    if (!item.productId || item.productId.startsWith("demo-") || !item.variantId || !item.name) continue;
    const quantity = Math.min(20, Math.max(0, Math.floor(item.quantity)));
    if (quantity <= 0 || !Number.isInteger(item.unitPence) || item.unitPence < 0) continue;
    const existing = merged.get(item.productId);
    merged.set(item.productId, {
      ...item,
      vendor: item.vendor || "Vendor",
      quantity: Math.min(20, (existing?.quantity ?? 0) + quantity),
    });
  }
  return [...merged.values()].slice(0, 30);
}

export async function readGuestCart(): Promise<GuestCartItem[]> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return [];
  const data = readPayload<GuestCartItem[]>(token, "guest-cart");
  return Array.isArray(data) ? normalize(data) : [];
}

export async function writeGuestCart(items: GuestCartItem[]) {
  const jar = await cookies();
  const next = normalize(items);
  if (!next.length) {
    jar.delete(CART_COOKIE);
    return;
  }
  jar.set(CART_COOKIE, signPayload("guest-cart", next, CART_TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(CART_TTL_MS / 1000),
  });
}

export async function addGuestCartItem(item: GuestCartItem) {
  const items = await readGuestCart();
  items.push(item);
  await writeGuestCart(items);
}

export async function setGuestCartQuantity(productId: string, quantity: number) {
  const items = await readGuestCart();
  const next = items.filter((item) => item.productId !== productId);
  const current = items.find((item) => item.productId === productId);
  if (current && quantity > 0) next.push({ ...current, quantity });
  await writeGuestCart(next);
}

export async function clearGuestCart() {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
}
