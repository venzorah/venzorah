import { Suspense } from "react";
import { connection } from "next/server";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront-chrome";
import { StorefrontMobileNav } from "@/components/mobile-nav";
import { getSessionUser } from "@/lib/auth";
import { staticCategories } from "@/lib/category-display";
import { prisma } from "@/lib/db";
import { ensureDemoCatalog } from "@/lib/ensure-catalog";
import { ROLE_KEYS } from "@/lib/permissions";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  await connection();
  await ensureDemoCatalog();
  const session = await getSessionUser();
  let categories = staticCategories().map(({ name, slug }) => ({ name, slug }));
  try {
    const rows = await prisma.category.findMany({
      where: { enabled: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    });
    if (rows.length) categories = rows;
  } catch {
    categories = staticCategories().map(({ name, slug }) => ({ name, slug }));
  }
  const user = session
    ? {
        name: session.name,
        email: session.email,
        vendor: Boolean(session.vendorId) || session.roles.includes(ROLE_KEYS.VENDOR),
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col pb-20 lg:pb-0">
      <Suspense fallback={<div className="h-24 bg-navy" />}>
        <StorefrontHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <StorefrontFooter />
      <StorefrontMobileNav user={user} categories={categories} />
    </div>
  );
}
