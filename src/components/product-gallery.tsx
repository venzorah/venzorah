"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#ececec] text-sm text-muted">
        No image
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl bg-[#ececec]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt ?? name} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              aria-label={index === 0 ? "Featured image" : `Gallery image ${index}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => setActive(index)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#ececec]",
                index === active ? "ring-2 ring-ink" : "ring-1 ring-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}