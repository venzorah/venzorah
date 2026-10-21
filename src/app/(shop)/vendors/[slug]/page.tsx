import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { PageHeader } from "@/components/ui";

export default async function VendorStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { storeSlug: slug },
    include: {
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
  if (!vendor || vendor.visibility !== "PUBLIC") notFound();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title={vendor.storeName} description={vendor.description ?? undefined} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {vendor.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
