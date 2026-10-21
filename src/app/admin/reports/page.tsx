import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { formatGbp } from "@/lib/money";
import { Card, PageHeader } from "@/components/ui";

export default async function ReportsPage() {
  await requirePermission("admin.finance.manage");
  const [gross, commission, tax, payouts] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalPence: true, taxPence: true, shippingPence: true }, where: { paymentStatus: "PAID" } }),
    prisma.vendorOrder.aggregate({ _sum: { commissionPence: true, vendorNetPence: true } }),
    prisma.order.aggregate({ _sum: { taxPence: true } }),
    prisma.withdrawalRequest.aggregate({ _sum: { amountPence: true }, where: { status: { in: ["PENDING", "PROCESSING"] } } }),
  ]);
  return (
    <>
      <PageHeader title="Financial reports" description="VAT is recorded according to vatMode. It is not automatically treated as platform revenue." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>Gross {formatGbp(gross._sum.totalPence ?? 0)}</Card>
        <Card>Commission {formatGbp(commission._sum.commissionPence ?? 0)}</Card>
        <Card>Vendor net {formatGbp(commission._sum.vendorNetPence ?? 0)}</Card>
        <Card>Tax recorded {formatGbp(tax._sum.taxPence ?? 0)}</Card>
        <Card>Outstanding payouts {formatGbp(payouts._sum.amountPence ?? 0)}</Card>
      </div>
    </>
  );
}
