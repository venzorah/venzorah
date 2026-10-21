import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function AuditPage() {
  await requirePermission("admin.audit.view");
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Audit log" />
      <ul className="grid gap-2 text-sm">
        {logs.map((l) => (
          <li key={l.id} className="rounded-xl border border-border bg-card p-3">
            {formatDate(l.createdAt)} · {l.actor?.email ?? "system"} · {l.action} · {l.entity}
          </li>
        ))}
      </ul>
    </>
  );
}
