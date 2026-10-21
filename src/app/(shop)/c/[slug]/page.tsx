import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { categoryBySlug } from "@/lib/category-display";
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
        <EmptyState title="No published products in this category yet." />
      </main>
    );
  }
  if (!category || !category.enabled) notFound();
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
      {category.products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title="No published products in this category yet." />
      )}
    </main>
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
