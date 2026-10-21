import { Suspense } from "react";
import { connection } from "next/server";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront-chrome";
import { StorefrontMobileNav } from "@/components/mobile-nav";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <div className="flex min-h-dvh flex-col pb-16 lg:pb-0">
      <Suspense fallback={<div className="h-24 bg-navy" />}>
        <StorefrontHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <StorefrontFooter />
      <StorefrontMobileNav />
    </div>
  );
}
