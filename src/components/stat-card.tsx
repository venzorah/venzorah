import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent = "navy",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "navy" | "gold" | "success" | "info";
}) {
  const bar = {
    navy: "bg-navy",
    gold: "bg-gold",
    success: "bg-success",
    info: "bg-info",
  } as const;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
      <span className={cn("absolute inset-y-0 left-0 w-1", bar[accent])} />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </section>
  );
}
