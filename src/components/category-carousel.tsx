"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { categoryLabel } from "@/lib/category-display";

export type CategoryTile = {
  name: string;
  slug: string;
  image: string | null;
};

export function CategoryCarousel({ items }: { items: CategoryTile[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  function step() {
    const el = scroller.current;
    if (!el) return 168;
    const card = el.querySelector<HTMLElement>("[data-card]");
    return (card?.offsetWidth ?? 152) + 16;
  }

  function scrollByDir(dir: number) {
    const el = scroller.current;
    if (!el) return;
    const amount = step();
    const max = el.scrollWidth - el.clientWidth;
    const next = el.scrollLeft + dir * amount;
    if (dir > 0 && next >= max - 8) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir < 0 && el.scrollLeft <= 8) {
      el.scrollTo({ left: max, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  useEffect(() => {
    if (items.length < 4) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      if (scroller.current?.matches(":hover")) return;
      scrollByDir(1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">Shop by category</h2>
      <div className="relative mt-5">
        <button
          type="button"
          aria-label="Previous categories"
          onClick={() => scrollByDir(-1)}
          className="absolute -left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-[70%] items-center justify-center rounded-full bg-card text-ink shadow-sm ring-1 ring-border md:inline-flex"
        >
          ‹
        </button>
        <div
          ref={scroller}
          className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/c/${item.slug}`}
              data-card
              className="w-[132px] shrink-0 snap-start sm:w-[148px]"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#ececec]">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-muted">{item.name.slice(0, 1)}</span>
                )}
              </div>
              <p className="mt-2 text-center text-[13px] leading-snug text-ink">
                {categoryLabel(item.name)}
              </p>
            </Link>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next categories"
          onClick={() => scrollByDir(1)}
          className="absolute -right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-[70%] items-center justify-center rounded-full bg-card text-ink shadow-sm ring-1 ring-border md:inline-flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}
