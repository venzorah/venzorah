import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminReviewKyc, adminSetVendorFlags } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, PageHeader } from "@/components/ui";

export default async function AdminVendorDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.vendor.manage");
  const { id } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: { user: true, kycSubmissions: true, products: true },
  });
  if (!vendor) notFound();
  return (
    <>
      <PageHeader title={vendor.storeName} description="Suspension blocks new sales but does not erase products or existing orders." />
      <ActionForm action={adminSetVendorFlags} className="grid max-w-lg gap-2">
        <input type="hidden" name="id" value={vendor.id} />
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="canPublish" defaultChecked={vendor.canPublish} /> Publish
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="canAcceptOrders" defaultChecked={vendor.canAcceptOrders} /> Accept orders
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="canEditListings" defaultChecked={vendor.canEditListings} /> Edit listings
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="canUsePromotions" defaultChecked={vendor.canUsePromotions} /> Promotions
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="canRequestPayouts" defaultChecked={vendor.canRequestPayouts} /> Payouts
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="payoutEligible" defaultChecked={vendor.payoutEligible} /> Payout eligible
        </label>
        <select name="status" defaultValue={vendor.status} className="tap-target rounded-xl border px-3">
          <option>ACTIVE</option>
          <option>SUSPENDED</option>
        </select>
        <select name="kycStatus" defaultValue={vendor.kycStatus} className="tap-target rounded-xl border px-3">
          <option>UNVERIFIED</option>
          <option>PENDING</option>
          <option>APPROVED</option>
          <option>REJECTED</option>
        </select>
        <Button type="submit">Save vendor flags</Button>
      </ActionForm>
      <h2 className="mt-8 font-bold">KYC submissions</h2>
      {vendor.kycSubmissions.map((s) => (
        <form
          key={s.id}
          className="mt-2 flex flex-wrap gap-2"
          action={async () => {
            "use server";
            await adminReviewKyc(s.id, "APPROVED");
          }}
        >
          <span className="text-sm">{s.status}</span>
          <Button type="submit">Approve</Button>
        </form>
      ))}
    </>
  );
}
