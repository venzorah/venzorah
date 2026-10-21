import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { Badge, PageHeader } from "@/components/ui";

export default async function AdminVendorsPage() {
  await requirePermission("admin.vendor.manage");
  const vendors = await prisma.vendorProfile.findMany({ include: { user: true, subscriptions: { include: { plan: true } } } });
  return (
    <>
      <PageHeader title="Vendors" />
      <div className="grid gap-3">
        {vendors.map((v) => (
          <Link key={v.id} href={`/admin/vendors/${v.id}`} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{v.storeName}</p>
                <p className="text-sm">{v.user.email}</p>
              </div>
              <Badge>{v.kycStatus}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
