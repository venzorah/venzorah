import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminSaveCoupon } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader } from "@/components/ui";

export default async function AdminPromotionsPage() {
  await requirePermission("admin.promotion.manage");
  const coupons = await prisma.coupon.findMany();
  return (
    <>
      <PageHeader title="Promotions" />
      <ul className="mb-6 grid gap-2">
        {coupons.map((c) => (
          <li key={c.id} className="rounded-xl border border-border bg-card p-3">
            {c.code} · {c.type} {c.value}
          </li>
        ))}
      </ul>
      <ActionForm action={adminSaveCoupon} className="grid max-w-lg gap-3">
        <Field label="Code">
          <Input name="code" required />
        </Field>
        <Field label="Type">
          <select name="type" className="tap-target rounded-xl border px-3">
            <option value="PERCENT">Percent (basis points, 1000 = 10%)</option>
            <option value="FIXED">Fixed pence</option>
          </select>
        </Field>
        <Field label="Value">
          <Input name="value" type="number" defaultValue={1000} />
        </Field>
        <Button type="submit">Create coupon</Button>
      </ActionForm>
    </>
  );
}
