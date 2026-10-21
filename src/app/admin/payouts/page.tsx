import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminReviewPayout } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";
import { formatGbp } from "@/lib/money";

export default async function AdminPayoutsPage() {
  await requirePermission("admin.finance.manage");
  const requests = await prisma.withdrawalRequest.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Payouts" />
      <div className="grid gap-3">
        {requests.map((r) => (
          <section key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <p>
              {r.vendor.storeName} · {formatGbp(r.amountPence)} · {r.status}
            </p>
            <div className="mt-2 flex gap-2">
              <form action={async () => { "use server"; await adminReviewPayout(r.id, "COMPLETED"); }}>
                <Button type="submit">Approve</Button>
              </form>
              <form action={async () => { "use server"; await adminReviewPayout(r.id, "REJECTED", "Insufficient documentation"); }}>
                <Button type="submit" variant="secondary">
                  Reject
                </Button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
