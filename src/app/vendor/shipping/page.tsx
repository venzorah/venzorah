import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { saveShippingMethod } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function ShippingPage() {
  const user = await requirePermission("vendor.shipping.manage");
  const [zones, methods] = await Promise.all([
    prisma.shippingZone.findMany(),
    prisma.shippingMethod.findMany({ where: { vendorId: user.vendorId! }, include: { zone: true } }),
  ]);
  return (
    <>
      <PageHeader title="Shipping" description="Checkout blocks destinations your methods cannot serve. Multi-vendor carts are quoted per vendor." />
      <div className="grid gap-3">
        {methods.map((m) => (
          <p key={m.id} className="rounded-2xl border border-border bg-card p-4">
            {m.name} · {m.zone.name} · {formatGbp(m.pricePence)}
          </p>
        ))}
      </div>
      <ActionForm action={saveShippingMethod} className="mt-6 grid max-w-lg gap-3">
        <Field label="Zone">
          <select name="zoneId" className="tap-target rounded-xl border px-3">
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name">
          <Input name="name" defaultValue="Standard" />
        </Field>
        <Field label="Code">
          <Input name="code" defaultValue="STANDARD" />
        </Field>
        <Field label="Carrier">
          <Input name="carrier" defaultValue="Royal Mail" />
        </Field>
        <Field label="Price GBP">
          <Input name="price" defaultValue="4.95" />
        </Field>
        <Button type="submit">Add method</Button>
      </ActionForm>
    </>
  );
}
