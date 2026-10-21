import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { staticCategories } from "@/lib/category-display";
import { filterDemoProducts } from "@/lib/demo-catalog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  try {
    const user = await getSessionUser();
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
    const wishedIds = new Set(wished.map((item) => item.productId));
    return (
      <Catalogue q={q} category={category} products={products} categories={categories} wishedIds={wishedIds} />
    );
  } catch (error) {
    console.error("Products page skipped the database:", error instanceof Error ? error.message : error);
    return (
      <Catalogue
        q={q}
        category={category}
        products={filterDemoProducts(q, category)}
        categories={staticCategories().slice(0, 8)}
        wishedIds={new Set()}
      />
    );
  }
}

function Catalogue({
  category,
  products,
  categories,
  wishedIds,
}: {
  q?: string;
  category?: string;
  products: Parameters<typeof ProductCard>[0]["product"][];
  categories: { id: string; name: string; slug: string }[];
  wishedIds: Set<string>;
}) {
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
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/products?category=${item.slug}`}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === item.slug ? "bg-navy text-white" : "border border-border bg-card text-ink"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
      {products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} wished={wishedIds.has(product.id)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No products match that search." />
      )}
    </main>
  );
}
