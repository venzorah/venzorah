import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { vendorHasChosenPlan } from "@/lib/commerce";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage() {
  const user = await requirePermission("vendor.product.create");
  if (!user.vendorId || !(await vendorHasChosenPlan(user.vendorId))) {
    redirect("/vendor/subscription?choose=1");
  }
  const categories = await prisma.category.findMany({
    where: { enabled: true },
    include: { attributes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeader
        title="Create product"
        description="Fields change with the selected category. Listing limits are enforced on the server."
      />
      <ProductForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          attributes: c.attributes,
        }))}
      />
    </>
  );
}
