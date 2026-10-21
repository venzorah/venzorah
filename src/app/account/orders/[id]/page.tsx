import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatGbp } from "@/lib/money";
import {
  cancelOrder,
  completeSandboxPayment,
  customerConfirmDelivery,
  requestReturn,
} from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Badge, Button, Field, PageHeader, Textarea } from "@/components/ui";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { paid } = await searchParams;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      vendorOrders: { include: { vendor: true, items: true, disputes: true } },
      payments: true,
    },
  });
  if (!order) notFound();

  return (
    <>
      <PageHeader title={order.number} description={paid ? "Payment confirmed." : undefined} />
      <div className="grid gap-2 text-sm">
        <p>Payment: {order.paymentStatus}</p>
        <p>Subtotal {formatGbp(order.subtotalPence)}</p>
        <p>Shipping {formatGbp(order.shippingPence)}</p>
        <p>Tax recorded {formatGbp(order.taxPence)} (not treated as platform revenue)</p>
        <p>Discount {formatGbp(order.discountPence)}</p>
        <p className="font-bold">Total {formatGbp(order.totalPence)}</p>
      </div>
      {order.paymentStatus !== "PAID" ? (
        <ActionForm action={completeSandboxPayment} className="mt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <Button type="submit">Complete sandbox payment</Button>
        </ActionForm>
      ) : null}
      <form
        action={async () => {
          "use server";
          await cancelOrder(order.id);
        }}
        className="mt-4"
      >
        <Button type="submit" variant="secondary">
          Cancel eligible order
        </Button>
      </form>
      <div className="mt-6 grid gap-4">
        {order.vendorOrders.map((vo) => (
          <section key={vo.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{vo.vendor.storeName}</h2>
              <Badge>{vo.status}</Badge>
            </div>
            {vo.items.map((i) => (
              <p key={i.id} className="text-sm">
                {i.nameSnapshot} × {i.quantity} — {formatGbp(i.totalPence)}
              </p>
            ))}
            {vo.trackingNumber ? (
              <p className="mt-2 text-sm">
                Tracking: {vo.trackingCarrier} {vo.trackingNumber}
              </p>
            ) : null}
            {vo.status === "DELIVERED" ? (
              <form
                className="mt-3"
                action={async () => {
                  "use server";
                  await customerConfirmDelivery(vo.id);
                }}
              >
                <Button type="submit" variant="navy">
                  Confirm delivery
                </Button>
              </form>
            ) : null}
            <ActionForm action={requestReturn} className="mt-4 grid gap-2">
              <input type="hidden" name="vendorOrderId" value={vo.id} />
              <Field label="Return / problem type">
                <select name="type" className="tap-target rounded-xl border border-border px-3">
                  <option value="RETURN">Return</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="MISSING">Missing</option>
                </select>
              </Field>
              <Field label="Details">
                <Textarea name="reason" required />
              </Field>
              <Button type="submit" variant="secondary">
                Submit request
              </Button>
            </ActionForm>
          </section>
        ))}
      </div>
    </>
  );
}
