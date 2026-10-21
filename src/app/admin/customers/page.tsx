import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("admin.customer.manage");
  const { q } = await searchParams;
  const customers = await prisma.user.findMany({
    where: {
      customer: { isNot: null },
      ...(q
        ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] }
        : {}),
    },
    include: { _count: { select: { orders: true } }, orders: { select: { totalPence: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Customers" />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search name or email" className="tap-target w-full max-w-md rounded-xl border px-3" />
      </form>
      <div className="grid gap-3">
        {customers.map((c) => (
          <Link key={c.id} href={`/admin/customers/${c.id}`} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-sm">{c.email}</p>
              </div>
              <Badge>{c.status}</Badge>
            </div>
            <p className="text-sm text-muted">
              Orders {c._count.orders} · Verified {c.emailVerifiedAt ? "yes" : "no"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
