"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "./ui";

type CartPrompt = { name?: string };

const CartPromptContext = createContext<{ show: (prompt?: CartPrompt) => void } | null>(null);

export function useCartPrompt() {
  const ctx = useContext(CartPromptContext);
  if (!ctx) throw new Error("useCartPrompt must be used within CartPromptProvider");
  return ctx;
}

export function CartPromptProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<CartPrompt | null>(null);
  const titleId = useId();
  const pathname = usePathname();
  const show = useCallback((next?: CartPrompt) => setPrompt(next ?? {}), []);
  const close = useCallback(() => setPrompt(null), []);

  useEffect(() => {
    setPrompt(null);
  }, [pathname]);

  useEffect(() => {
    if (!prompt) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prompt, close]);

  return (
    <CartPromptContext.Provider value={{ show }}>
      {children}
      {prompt ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-navy-deep/45"
            aria-label="Close"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl ring-1 ring-border"
          >
            <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold text-xl font-bold text-navy">
              ✓
            </p>
            <h2 id={titleId} className="mt-4 text-xl font-extrabold tracking-tight text-ink">
              Added to cart
            </h2>
            <p className="mt-2 text-sm text-muted">
              {prompt.name ? `${prompt.name} is in your cart.` : "Your item is in your cart."} Checkout now, or keep shopping.
            </p>
            <div className="mt-6 grid gap-2">
              <Link
                href="/checkout"
                onClick={close}
                className="tap-target inline-flex items-center justify-center rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-navy hover:bg-gold-dark"
              >
                Proceed to checkout
              </Link>
              <Button type="button" variant="secondary" className="rounded-full" onClick={close}>
                Continue shopping
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </CartPromptContext.Provider>
  );
}
