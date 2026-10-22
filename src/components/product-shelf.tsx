import Link from "next/link";
import { ProductCard, type ProductCardProduct } from "@/components/product-card";
import { categoryLabel, staticCategories } from "@/lib/category-display";

export type ShelfProduct = ProductCardProduct & {
  categoryName: string;
  categorySlug: string;
};

export function ProductShelves({
  products,
  wishedIds,
}: {
  products: ShelfProduct[];
  wishedIds?: Set<string>;
}) {
  const featured = products.filter((product) => product.featured);
  const lead = (featured.length ? featured : products).slice(0, 10);
  const order = staticCategories().map((category) => category.slug);
  const groups = new Map<string, { name: string; slug: string; products: ShelfProduct[] }>();
  for (const product of products) {
    if (!product.categorySlug) continue;
    const group = groups.get(product.categorySlug) ?? {
      name: product.categoryName,
      slug: product.categorySlug,
      products: [],
    };
    if (group.products.length < 8) group.products.push(product);
    groups.set(product.categorySlug, group);
  }
  const categories = [...groups.values()].sort(
    (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-16">
      <Shelf title="Featured" href="/products" products={lead} wishedIds={wishedIds} />
      {categories.map((group) => (
        <Shelf
          key={group.slug}
          title={categoryLabel(group.name)}
          href={`/c/${group.slug}`}
          products={group.products}
          wishedIds={wishedIds}
        />
      ))}
    </div>
  );
}

function Shelf({
  title,
  href,
  products,
  wishedIds,
}: {
  title: string;
  href: string;
  products: ShelfProduct[];
  wishedIds?: Set<string>;
}) {
  if (!products.length) return null;
  return (
    <section className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-5 w-1 shrink-0 rounded-full bg-gold" />
          <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>
        </div>
        <Link href={href} className="shrink-0 text-xs font-bold uppercase tracking-wide text-navy">
          See all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto p-3">
        {products.map((product) => (
          <div key={product.id} className="w-44 shrink-0 sm:w-52">
            <ProductCard product={product} wished={wishedIds?.has(product.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
