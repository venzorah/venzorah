import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { updateVendorOrderStatus } from "@/app/actions/marketplace";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function VendorOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("vendor.order.manage");
  const { id } = await params;
  const vo = await prisma.vendorOrder.findFirst({
    where: { id, vendorId: user.vendorId! },
    include: { order: true, items: true, disputes: true },
  });
  if (!vo) notFound();
  return (
    <>
      <PageHeader title={vo.order.number} description={`Status ${vo.status}`} />
      <p className="text-sm">
        Ship to {vo.order.shippingName}, {vo.order.shippingLine1}, {vo.order.shippingCity}
        {vo.order.shippingRegion ? `, ${vo.order.shippingRegion}` : ""} {vo.order.shippingPostcode}
      </p>
      {vo.items.map((i) => (
        <p key={i.id}>
          {i.nameSnapshot} × {i.quantity} · {formatGbp(i.totalPence)}
        </p>
      ))}
      <form
        className="mt-6 grid max-w-md gap-3"
        action={async (fd) => {
          "use server";
          await updateVendorOrderStatus(vo.id, String(fd.get("status")), String(fd.get("tracking") ?? ""));
        }}
      >
        <Field label="Fulfilment status">
          <select name="status" defaultValue={vo.status} className="tap-target rounded-xl border px-3">
            <option>NEW</option>
            <option>PROCESSING</option>
            <option>DISPATCHED</option>
            <option>DELIVERED</option>
          </select>
        </Field>
        <Field label="Tracking number">
          <Input name="tracking" defaultValue={vo.trackingNumber ?? ""} />
        </Field>
        <Button type="submit">Update fulfilment</Button>
      </form>
    </>
  );
}
