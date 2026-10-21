import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { startSylmeraKyc, submitKyc, syncSylmeraKyc } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea, Badge } from "@/components/ui";
import { isSylmeraConfigured } from "@/lib/sylmera";

export default async function KycPage({
  searchParams,
}: {
  searchParams: Promise<{ sylmera?: string }>;
}) {
  const user = await requirePermission("vendor.kyc.submit");
  const query = await searchParams;
  if (query.sylmera === "1") await syncSylmeraKyc();
  const vendor = await prisma.vendorProfile.findUniqueOrThrow({
    where: { id: user.vendorId! },
    include: { kycSubmissions: { orderBy: { submittedAt: "desc" } } },
  });
  const configured = isSylmeraConfigured();
  const approved = vendor.kycStatus === "APPROVED";

  return (
    <>
      <PageHeader
        title="Seller verification"
        description="Verify as an individual seller or a UK registered business with Sylmera Identity. Photograph a passport, driving licence or national ID. Business checks also read Companies House."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{vendor.kycStatus}</Badge>
        <span className="text-sm text-muted">
          {vendor.sellerType === "BUSINESS" ? "Business seller" : "Individual seller"}
        </span>
      </div>

      {approved ? (
        <p className="mt-6 max-w-lg rounded-2xl border border-border bg-card p-4 text-sm text-muted">
          Your store is verified. Payouts can be requested and customers see a trusted seller. You can run a new Sylmera check if details change.
        </p>
      ) : null}

      <div className="mt-6 grid max-w-3xl gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold text-ink">Individual seller</h2>
          <p className="mt-2 text-sm text-muted">
            Photo ID and a live face check. Optional proof of UK address on the Sylmera page.
          </p>
          <ActionForm action={startSylmeraKyc} successMessage={null} className="mt-4">
            <input type="hidden" name="kind" value="person" />
            <Button type="submit" className="w-full rounded-full">
              Start identity check
            </Button>
          </ActionForm>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold text-ink">UK business</h2>
          <p className="mt-2 text-sm text-muted">
            Company number against the UK register, plus identity of the person completing the check.
          </p>
          <ActionForm action={startSylmeraKyc} successMessage={null} className="mt-4">
            <input type="hidden" name="kind" value="business" />
            <Button type="submit" variant="navy" className="w-full rounded-full">
              Start business check
            </Button>
          </ActionForm>
        </article>
      </div>

      {!configured ? (
        <p className="mt-4 max-w-3xl text-sm text-warning">
          Sylmera is not configured. Add SYLMERA_API_KEY (and SYLMERA_WEBHOOK_SECRET for live results). You can still send documents for a staff review below.
        </p>
      ) : (
        <p className="mt-4 max-w-3xl text-sm text-muted">
          Webhook URL for the Sylmera portal: {(process.env.APP_URL ?? "http://localhost:3000")}/api/webhooks/sylmera
        </p>
      )}

      <ActionForm action={submitKyc} className="mt-8 grid max-w-lg gap-3" encType="multipart/form-data">
        <p className="text-sm font-semibold text-ink">Extra documents for staff (optional)</p>
        <Field label="Verification type">
          <select name="kind" className="tap-target w-full rounded-xl border border-border bg-card px-3 text-sm text-ink">
            <option value="person">Individual seller</option>
            <option value="business">UK business</option>
          </select>
        </Field>
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
        <Field label="Supporting file" hint="Stored privately. Use camera capture on a phone.">
          <Input name="document" type="file" accept="image/*,.pdf" capture="environment" />
        </Field>
        <Button type="submit" variant="secondary">
          Send for staff review
        </Button>
      </ActionForm>

      <ul className="mt-8 grid max-w-3xl gap-2 text-sm">
        {vendor.kycSubmissions.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-card p-3">
            <p className="font-semibold text-ink">
              {s.kind === "business" ? "Business" : "Individual"} · {s.provider} · {s.status}
            </p>
            <p className="text-muted">
              {s.providerStatus ? `Sylmera ${s.providerStatus}` : s.notes || "Submitted"}
            </p>
            {s.hostedUrl && s.status === "PENDING" ? (
              <a href={s.hostedUrl} className="mt-1 inline-block font-semibold text-ink underline">
                Continue verification
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
