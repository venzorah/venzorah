"use client";

import { useState, useTransition } from "react";
import { addToCartFromForm, toggleWishlistForm } from "@/app/actions/marketplace";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, wished }: { productId: string; wished?: boolean }) {
  const [on, setOn] = useState(Boolean(wished));
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        const data = new FormData();
        data.set("productId", productId);
        start(async () => {
          const result = await toggleWishlistForm(data);
          if (result?.error) setOn(!next);
        });
      }}
      className="tap-target absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg shadow-sm"
    >
      <span className={cn(on ? "text-error" : "text-muted")}>{on ? "♥" : "♡"}</span>
    </button>
  );
}

export function QuickAddButton({
  productId,
  variantId,
}: {
  productId: string;
  variantId?: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      aria-label="Add to cart"
      disabled={pending}
      onClick={() => {
        const data = new FormData();
        data.set("productId", productId);
        if (variantId) data.set("variantId", variantId);
        data.set("quantity", "1");
        start(async () => {
          const result = await addToCartFromForm(data);
          if (!result?.error) {
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          }
        });
      }}
      className="tap-target absolute bottom-3 right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold text-2xl font-bold text-navy shadow-md hover:bg-gold-dark"
    >
      {done ? "✓" : "+"}
    </button>
  );
}
