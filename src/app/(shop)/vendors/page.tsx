import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export default async function VendorsPage() {
  const vendors = await prisma.vendorProfile.findMany({
    where: { status: "ACTIVE", visibility: "PUBLIC" },
    orderBy: { storeName: "asc" },
  });
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Vendors" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Link key={v.id} href={`/vendors/${v.storeSlug}`} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">{v.storeName}</p>
            <p className="text-sm text-muted">{v.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
