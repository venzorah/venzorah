import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
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
  if (!category || !category.enabled) notFound();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title={category.name} description={category.description ?? undefined} />
      {category.children.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <a key={c.id} href={`/c/${c.slug}`} className="rounded-full bg-white px-3 py-1 text-sm font-medium">
              {c.name}
            </a>
          ))}
        </div>
      ) : null}
      {category.products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {category.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="No published products in this category yet." />
      )}
    </main>
  );
}
