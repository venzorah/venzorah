import { cookies } from "next/headers";
import { demoProductById } from "./demo-catalog";
import { demoShippingPence } from "./demo-stripe";
import { readPayload, signPayload } from "./signed-payload";

const CART_COOKIE = "venzorah_demo_cart";
const CART_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type DemoCartItem = { productId: string; quantity: number };

function normalize(items: DemoCartItem[]) {
  const merged = new Map<string, number>();
  for (const item of items) {
    if (!item.productId.startsWith("demo-")) continue;
    const quantity = Math.min(20, Math.max(0, Math.floor(item.quantity)));
    if (quantity <= 0) continue;
    merged.set(item.productId, Math.min(20, (merged.get(item.productId) ?? 0) + quantity));
  }
  return [...merged.entries()].slice(0, 30).map(([productId, quantity]) => ({ productId, quantity }));
}

export async function readDemoCart(): Promise<DemoCartItem[]> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return [];
  const data = readPayload<DemoCartItem[]>(token, "cart");
  return Array.isArray(data) ? normalize(data) : [];
}

export async function writeDemoCart(items: DemoCartItem[]) {
  const jar = await cookies();
  const next = normalize(items);
  if (!next.length) {
    jar.delete(CART_COOKIE);
    return;
  }
  jar.set(CART_COOKIE, signPayload("cart", next, CART_TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(CART_TTL_MS / 1000),
  });
}

export async function addDemoCartItem(productId: string, quantity: number) {
  const items = await readDemoCart();
  items.push({ productId, quantity });
  await writeDemoCart(items);
}

export async function setDemoCartQuantity(productId: string, quantity: number) {
  const items = await readDemoCart();
  const next = items.filter((item) => item.productId !== productId);
  if (quantity > 0) next.push({ productId, quantity });
  await writeDemoCart(next);
}

export async function clearDemoCart() {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
}

export async function demoCartLines() {
  const items = await readDemoCart();
  return items.flatMap((item) => {
    const product = demoProductById(item.productId);
    if (!product) return [];
    const unitPence = product.salePricePence ?? product.pricePence;
    return [
      {
        id: product.id,
        name: product.name,
        vendor: product.vendor.storeName,
        quantity: item.quantity,
        unitPence,
        source: "demo" as const,
      },
    ];
  });
}

export function demoCartTotals(subtotalPence: number) {
  const shippingPence = demoShippingPence(subtotalPence);
  return { subtotalPence, shippingPence, totalPence: subtotalPence + shippingPence };
}
