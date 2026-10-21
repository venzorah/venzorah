import Link from "next/link";
import { HeroSlider, type HeroSlide } from "./hero-slider";

const SHORT_NAMES: Record<string, string> = {
  "African Food and Groceries": "Food and groceries",
  "Fashion and Clothing": "Fashion",
  "Traditional and Cultural Wear": "Traditional wear",
  "Bags and Accessories": "Bags",
  "Beauty and Skincare": "Beauty",
  "Hair Products and Hair Accessories": "Hair",
  "Home and Living": "Home and living",
  "Furniture and Furnishings": "Furniture",
  "Art and Handmade Crafts": "Art and crafts",
};

export function HomeHero({
  slides,
  categories,
}: {
  slides: HeroSlide[];
  categories: { name: string; slug: string }[];
}) {
  const list = categories.slice(0, 9);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)_210px]">
        <aside className="hidden min-h-[24rem] rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border lg:flex">
          <nav className="flex h-full w-full flex-col">
            {list.map((c) => (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-surface"
              >
                <span>{SHORT_NAMES[c.name] ?? c.name}</span>
                <span className="text-muted">›</span>
              </Link>
            ))}
            <Link
              href="/categories"
              className="mt-auto px-3 py-2.5 text-sm font-semibold text-gold-dark hover:underline"
            >
              Other categories
            </Link>
          </nav>
        </aside>

        <HeroSlider slides={slides} />

        <div className="hidden flex-col gap-4 lg:flex">
          <article className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-card px-5 py-6 text-center shadow-sm ring-1 ring-border">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink">
              ✓
            </span>
            <h2 className="mt-3 text-sm font-bold text-ink">Verified vendors</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Shop from trusted African vendors delivering across the UK.
            </p>
          </article>
          <article className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-card px-5 py-6 text-center shadow-sm ring-1 ring-border">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink">
              ⌂
            </span>
            <h2 className="mt-3 text-sm font-bold text-ink">UK-wide delivery</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Fast, reliable shipping to your doorstep.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
