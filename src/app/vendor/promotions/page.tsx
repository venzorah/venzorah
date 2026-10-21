import { requirePermission } from "@/lib/auth";
import { PageHeader, Alert } from "@/components/ui";

export default async function VendorPromotionsPage() {
  await requirePermission("vendor.promotion.manage");
  return (
    <>
      <PageHeader title="Promotions" />
      <Alert>
        Vendor-created promotions are only available when an administrator grants this capability. Platform coupons are
        managed in the admin dashboard.
      </Alert>
    </>
  );
}
