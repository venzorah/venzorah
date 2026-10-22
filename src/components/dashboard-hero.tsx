import type { ReactNode } from "react";

export function DashboardHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl bg-navy px-6 py-6 text-white shadow-sm sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">{eyebrow}</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-xl text-sm text-white/75">{description}</p> : null}
        </div>
        {action}
      </div>
    </section>
  );
}
