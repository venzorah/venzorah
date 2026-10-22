import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { PageHeader } from "@/components/ui";
import { demoProductsForStore } from "@/lib/demo-catalog";

export default async function VendorStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
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
    if (vendor?.visibility === "PUBLIC") {
      return (
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader title={vendor.storeName} description={vendor.description ?? "Products from this store."} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {vendor.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>
      );
    }
    if (vendor) notFound();
  } catch (error) {
    console.error("Store page skipped the database:", error instanceof Error ? error.message : error);
  }

  const products = demoProductsForStore(slug);
  if (!products.length) notFound();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title={products[0].vendor.storeName} description="Products from this store." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
