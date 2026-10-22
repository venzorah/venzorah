import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await requirePermission("admin.finance.manage");
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID" },
    include: { payments: true, vendorOrders: { include: { vendor: true } } },
    orderBy: { placedAt: "desc" },
    take: 500,
  });
  const rows = [
    "order,paymentRef,store,productPence,shippingPence,discountPence,commissionPence,vendorPence,taxPence,orderTotalPence",
  ];
  for (const order of orders) {
    const paymentRef = order.payments[0]?.providerRef ?? "";
    for (const vendorOrder of order.vendorOrders) {
      rows.push(
        [
          order.number,
          paymentRef,
          vendorOrder.vendor.storeName.replaceAll(",", " "),
          vendorOrder.subtotalPence,
          vendorOrder.shippingPence,
          vendorOrder.discountPence,
          vendorOrder.commissionPence,
          vendorOrder.vendorNetPence,
          vendorOrder.taxPence,
          order.totalPence,
        ].join(","),
      );
    }
  }
  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=venzorah-allocations.csv",
    },
  });
}
