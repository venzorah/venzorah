import Link from "next/link";
import { prisma } from "@/lib/db";
import { categoryImage, categoryLabel, staticCategories } from "@/lib/category-display";

export default async function CategoriesPage() {
  let categories: { id: string; name: string; slug: string; image: string | null }[] = staticCategories();
  try {
    const rows = await prisma.category.findMany({
      where: { enabled: true, parentId: null },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length) {
      categories = rows.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: categoryImage(category.name, category.image),
      }));
    }
  } catch (error) {
    console.error("Categories page skipped the database:", error instanceof Error ? error.message : error);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight text-ink">All categories</h1>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {categories.map((category) => (
          <Link key={category.id} href={`/c/${category.slug}`} className="group">
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#ececec]">
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm text-muted">
                  {category.name.slice(0, 1)}
                </span>
              )}
            </div>
            <p className="mt-2 text-center text-[13px] leading-snug text-ink">{categoryLabel(category.name)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
