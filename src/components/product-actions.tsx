"use client";

import { useState, useTransition } from "react";
import { addToCartFromForm, toggleWishlistForm } from "@/app/actions/marketplace";
import { useCartPrompt } from "@/components/cart-prompt";
import { Button } from "@/components/ui";
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
  name,
}: {
  productId: string;
  variantId?: string;
  name?: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const prompt = useCartPrompt();

  return (
    <button
      type="button"
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
            prompt.show({ name });
            window.setTimeout(() => setDone(false), 1600);
          }
        });
      }}
      className="tap-target mt-2 inline-flex w-full items-center justify-center rounded-full bg-gold px-3 py-2 text-xs font-semibold text-navy hover:bg-gold-dark disabled:opacity-60 sm:text-sm"
    >
      {pending ? "Adding…" : done ? "Added" : "Add to cart"}
    </button>
  );
}

export function AddToCartButton({
  productId,
  variantId,
  name,
}: {
  productId: string;
  variantId?: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  const prompt = useCartPrompt();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => {
        const data = new FormData();
        data.set("productId", productId);
        if (variantId) data.set("variantId", variantId);
        data.set("quantity", "1");
        start(async () => {
          const result = await addToCartFromForm(data);
          if (!result?.error) prompt.show({ name });
        });
      }}
    >
      {pending ? "Adding…" : "Add to cart"}
    </Button>
  );
}
