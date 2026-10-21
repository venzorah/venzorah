import { Suspense } from "react";
import { connection } from "next/server";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront-chrome";
import { StorefrontMobileNav } from "@/components/mobile-nav";
import { ensureDemoCatalog } from "@/lib/ensure-catalog";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  await connection();
  await ensureDemoCatalog();
  return (
    <div className="flex min-h-dvh flex-col pb-20 lg:pb-0">
      <Suspense fallback={<div className="h-24 bg-navy" />}>
        <StorefrontHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <StorefrontFooter />
      <StorefrontMobileNav />
    </div>
  );
}
