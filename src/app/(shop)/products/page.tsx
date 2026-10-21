import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { PageHeader, EmptyState } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const user = await getSessionUser();
  const { q, category } = await searchParams;
  const [products, categories, wished] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(q
          ? {
              OR: [{ name: { contains: q } }, { description: { contains: q } }],
            }
          : {}),
        ...(category ? { category: { slug: category } } : {}),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        vendor: true,
        variants: true,
        attributes: true,
        reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { enabled: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
    user
      ? prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);
  const wishedIds = new Set(wished.map((w) => w.productId));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Products" description="Food, fashion, beauty, art, homewares and more from African vendors." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/products"
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
            !category ? "bg-navy text-white" : "border border-border bg-card text-ink"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === c.slug ? "bg-navy text-white" : "border border-border bg-card text-ink"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      {products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} wished={wishedIds.has(p.id)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No products match that search." />
      )}
    </main>
  );
}
