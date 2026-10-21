"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "./ui";
import { logoutAction } from "@/app/actions/auth";

export type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="grid gap-1" aria-label={`${title} navigation`}>
      {items.map((item) => {
        const isRoot = item.href === "/account" || item.href === "/vendor" || item.href === "/admin";
        const on = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "tap-target rounded-xl px-3 py-2 text-sm font-medium transition",
              on ? "bg-gold text-navy shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-navy px-4 py-3 text-white lg:hidden">
        <BrandMark href="/" className="[&_span]:text-white" size={40} />
        <div className="flex items-center gap-2">
          <ThemeToggle className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
          <Button type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Menu"}
          </Button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-30 bg-navy-deep p-4 pt-20 lg:hidden">
          <p className="mb-3 text-xs uppercase tracking-wider text-gold">{title}</p>
          {nav}
        </div>
      ) : null}
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[15.5rem_1fr]">
        <aside className="sticky top-0 hidden h-dvh overflow-y-auto bg-navy p-5 text-white lg:flex lg:flex-col">
          <BrandMark href="/" className="mb-8 [&_span]:text-white" size={44} />
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">{title}</p>
          <div className="flex-1">{nav}</div>
          <ThemeToggle className="mt-6 w-full border-white/20 bg-white/10 text-white hover:bg-white/20" />
          <Link href="/" className="mt-3 text-sm text-white/70 hover:text-gold">
            Back to marketplace
          </Link>
          <form action={logoutAction} className="mt-3">
            <Button type="submit" variant="secondary" className="w-full rounded-full">
              Sign out
            </Button>
          </form>
        </aside>
        <main className="min-w-0 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
