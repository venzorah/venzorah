import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { enabled: true, parentId: null },
    include: { children: { where: { enabled: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="All categories" description="Administrators can add, rename and reorder these without code changes." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <section key={c.id} className="rounded-2xl border border-border bg-card p-4">
            <Link href={`/c/${c.slug}`} className="text-lg font-bold text-ink">
              {c.name}
            </Link>
            <ul className="mt-2 grid gap-1 text-sm">
              {c.children.map((child) => (
                <li key={child.id}>
                  <Link href={`/c/${child.slug}`}>{child.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
