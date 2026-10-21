import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/product-form";
import { formatGbp } from "@/lib/money";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("vendor.product.create");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, vendorId: user.vendorId! },
      include: { attributes: true, variants: true },
    }),
    prisma.category.findMany({
      where: { enabled: true },
      include: { attributes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!product) notFound();
  return (
    <>
      <PageHeader title={product.name} description={`Status ${product.status} · ${formatGbp(product.pricePence)}`} />
      <ProductForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          attributes: c.attributes,
        }))}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          pricePence: product.pricePence,
          sku: product.sku,
          originCountry: product.originCountry,
          handlingDays: product.handlingDays,
          attributes: product.attributes,
        }}
      />
    </>
  );
}
