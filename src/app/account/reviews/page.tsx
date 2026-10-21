import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createReview } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea } from "@/components/ui";

export default async function ReviewsPage() {
  const user = await requireUser();
  const purchased = await prisma.orderItem.findMany({
    where: { vendorOrder: { order: { userId: user.id, paymentStatus: "PAID" } } },
    include: { product: true },
  });
  const reviews = await prisma.review.findMany({ where: { userId: user.id } });
  return (
    <>
      <PageHeader title="Reviews" description="Verified-purchase rules can be toggled by administrators." />
      <ActionForm action={createReview} className="grid max-w-lg gap-3">
        <Field label="Product">
          <select name="productId" className="tap-target rounded-xl border border-border px-3">
            {purchased.map((p) => (
              <option key={p.id} value={p.productId}>
                {p.product.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rating">
          <Input name="rating" type="number" min={1} max={5} defaultValue={5} />
        </Field>
        <Field label="Title">
          <Input name="title" />
        </Field>
        <Field label="Review">
          <Textarea name="body" required />
        </Field>
        <Button type="submit">Publish review</Button>
      </ActionForm>
      <ul className="mt-8 grid gap-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
            {r.rating}/5 — {r.title}
            <p className="text-sm">{r.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
