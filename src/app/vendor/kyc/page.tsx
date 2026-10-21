import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { submitKyc } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea, Badge } from "@/components/ui";

export default async function KycPage() {
  const user = await requirePermission("vendor.kyc.submit");
  const vendor = await prisma.vendorProfile.findUniqueOrThrow({
    where: { id: user.vendorId! },
    include: { kycSubmissions: { orderBy: { submittedAt: "desc" } } },
  });
  return (
    <>
      <PageHeader title="KYC and onboarding" description="Identity documents are stored as private references, never in ordinary API payloads." />
      <Badge>{vendor.kycStatus}</Badge>
      <ActionForm action={submitKyc} className="mt-6 grid max-w-lg gap-3">
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
        <Field label="Identity document" hint="Use camera capture on mobile. Only a private storage reference is saved.">
          <Input name="document" type="file" accept="image/*,.pdf" capture="environment" />
        </Field>
        <Button type="submit">Submit for review</Button>
      </ActionForm>
      <ul className="mt-6 grid gap-2 text-sm">
        {vendor.kycSubmissions.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-card p-3">
            {s.status} · {s.notes}
          </li>
        ))}
      </ul>
    </>
  );
}
