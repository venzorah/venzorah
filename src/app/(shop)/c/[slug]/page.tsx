import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { categoryBySlug } from "@/lib/category-display";
import { demoProductsForCategory } from "@/lib/demo-catalog";
import { ProductCard } from "@/components/product-card";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category: Awaited<ReturnType<typeof loadCategory>> = null;
  try {
    category = await loadCategory(slug);
  } catch (error) {
    console.error("Category page skipped the database:", error instanceof Error ? error.message : error);
    const known = categoryBySlug(slug);
    if (!known) notFound();
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader title={known.name} />
        <ProductGrid products={demoProductsForCategory(slug)} />
      </main>
    );
  }
  if (!category || !category.enabled) notFound();
  const listing = category.products.length ? category.products : demoProductsForCategory(slug);
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title={category.name} description={category.description ?? undefined} />
      {category.children.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <a key={child.id} href={`/c/${child.slug}`} className="rounded-full bg-white px-3 py-1 text-sm font-medium">
              {child.name}
            </a>
          ))}
        </div>
      ) : null}
      <ProductGrid products={listing} />
    </main>
  );
}

function ProductGrid({ products }: { products: Parameters<typeof ProductCard>[0]["product"][] }) {
  if (!products.length) return <EmptyState title="No published products in this category yet." />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function loadCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: true,
      products: {
        where: { status: "PUBLISHED" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          vendor: true,
          variants: true,
          attributes: true,
          reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
        },
      },
    },
  });
}
