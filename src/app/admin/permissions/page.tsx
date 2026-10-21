import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { adminToggleRolePermission } from "@/app/actions/marketplace";
import { Button, PageHeader } from "@/components/ui";

export default async function PermissionsPage() {
  await requirePermission("admin.permission.manage");
  const [roles, logs] = await Promise.all([
    prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }),
    prisma.permissionChangeLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const all = await prisma.permission.findMany({ orderBy: { key: "asc" } });
  return (
    <>
      <PageHeader title="Roles and permissions" description="Sensitive operations deny by default. The last administrator cannot be locked out." />
      {roles.map((role) => (
        <section key={role.id} className="mb-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-bold">{role.name}</h2>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {all.map((perm) => {
              const enabled = role.permissions.some((p) => p.permissionId === perm.id);
              return (
                <form
                  key={perm.id}
                  action={async () => {
                    "use server";
                    await adminToggleRolePermission(role.id, perm.id, !enabled);
                  }}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{perm.key}</span>
                  <Button type="submit" variant={enabled ? "navy" : "secondary"}>
                    {enabled ? "On" : "Off"}
                  </Button>
                </form>
              );
            })}
          </div>
        </section>
      ))}
      <h2 className="font-bold">Change history</h2>
      <ul className="mt-2 grid gap-2 text-sm">
        {logs.map((l) => (
          <li key={l.id}>{l.summary}</li>
        ))}
      </ul>
    </>
  );
}
