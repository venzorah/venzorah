"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";
import { CUSTOMER_NAV } from "@/lib/nav";
import { categoryLabel } from "@/lib/category-display";
import { cn } from "@/lib/utils";

export type MobileNavUser = { name: string; email: string; vendor: boolean } | null;
export type MobileNavCategory = { name: string; slug: string };

type Panel = "search" | "account" | "menu" | null;

export function StorefrontMobileNav({
  user,
  categories,
}: {
  user: MobileNavUser;
  categories: MobileNavCategory[];
}) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(null);

  useEffect(() => {
    setPanel(null);
  }, [pathname]);

  useEffect(() => {
    if (!panel) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  function toggle(next: Panel) {
    setPanel((current) => (current === next ? null : next));
  }

  const storeActive = pathname === "/" && panel === null;
  const wishlistActive = pathname.startsWith("/account/wishlist") && panel === null;

  return (
    <>
      {panel === "search" ? (
        <SearchPanel categories={categories} onClose={() => setPanel(null)} />
      ) : null}
      {panel === "account" ? <AccountPanel user={user} onClose={() => setPanel(null)} /> : null}
      {panel === "menu" ? (
        <MenuPanel user={user} categories={categories} onClose={() => setPanel(null)} />
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,33,104,0.08)] lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          <DockLink href="/" label="Store" active={storeActive} icon="store" />
          <DockButton label="Search" active={panel === "search"} icon="search" onClick={() => toggle("search")} />
          <DockButton label="Account" active={panel === "account"} icon="account" onClick={() => toggle("account")} />
          <DockLink href="/account/wishlist" label="Wishlist" active={wishlistActive} icon="heart" />
          <DockButton label="Menu" active={panel === "menu"} icon="menu" onClick={() => toggle("menu")} />
        </ul>
      </nav>
    </>
  );
}

function SearchPanel({
  categories,
  onClose,
}: {
  categories: MobileNavCategory[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background lg:hidden" role="dialog" aria-label="Search">
      <div className="flex items-center gap-2 bg-navy p-3">
        <button type="button" onClick={onClose} className="tap-target px-2 text-white" aria-label="Close search">
          <CloseIcon />
        </button>
        <form action="/products" className="flex min-w-0 flex-1">
          <input
            name="q"
            type="search"
            placeholder="Search products, brands and categories"
            autoFocus
            className="min-w-0 flex-1 rounded-l-xl bg-card px-3 py-2.5 text-sm text-ink outline-none"
          />
          <button type="submit" className="rounded-r-xl bg-gold px-4 text-sm font-bold text-navy">
            Search
          </button>
        </form>
      </div>
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Popular categories</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.slug}
              href={`/c/${category.slug}`}
              onClick={onClose}
              className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-border"
            >
              {categoryLabel(category.name)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountPanel({ user, onClose }: { user: MobileNavUser; onClose: () => void }) {
  return (
    <Sheet title="Account" onClose={onClose}>
      {user ? (
        <>
          <p className="font-bold text-ink">{user.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
          <ul className="mt-4 space-y-1">
            {CUSTOMER_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={onClose} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={user.vendor ? "/vendor" : "/sell-on-venzorah"}
                onClick={onClose}
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
              >
                {user.vendor ? "Dashboard" : "Sell on Venzorah"}
              </Link>
            </li>
          </ul>
          <form action={logoutAction} className="mt-4">
            <Button type="submit" variant="secondary" className="w-full rounded-full">
              Sign out
            </Button>
          </form>
        </>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted">Sign in to see orders, saved items and your profile.</p>
          <Link href="/login" onClick={onClose} className="rounded-full bg-navy px-4 py-2.5 text-center text-sm font-bold text-white">
            Sign in
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="rounded-full bg-card px-4 py-2.5 text-center text-sm font-bold text-navy ring-1 ring-navy"
          >
            Create an account
          </Link>
        </div>
      )}
    </Sheet>
  );
}

function MenuPanel({
  user,
  categories,
  onClose,
}: {
  user: MobileNavUser;
  categories: MobileNavCategory[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-navy/50 lg:hidden" role="dialog" aria-label="Menu">
      <button type="button" className="absolute inset-0" aria-label="Close menu" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-4/5 max-w-sm flex-col bg-card shadow-xl">
        <div className="flex items-center justify-between bg-navy px-4 py-4 text-white">
          <p className="font-extrabold">Venzorah</p>
          <button type="button" onClick={onClose} className="tap-target" aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {user ? (
            <div className="border-b border-border px-4 py-3">
              <p className="font-bold text-ink">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          ) : (
            <div className="flex gap-2 border-b border-border px-4 py-3">
              <Link href="/login" onClick={onClose} className="flex-1 rounded-full bg-navy py-2 text-center text-sm font-bold text-white">
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex-1 rounded-full py-2 text-center text-sm font-bold text-navy ring-1 ring-navy"
              >
                Register
              </Link>
            </div>
          )}
          <div className="px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Categories</p>
            <ul className="mt-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/c/${category.slug}`}
                    onClick={onClose}
                    className="block py-2 text-sm font-semibold text-ink"
                  >
                    {categoryLabel(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ul className="border-t border-border px-4 py-2">
            <li>
              <Link
                href={user?.vendor ? "/vendor" : "/sell-on-venzorah"}
                onClick={onClose}
                className="block py-2 text-sm font-semibold text-ink"
              >
                {user?.vendor ? "Dashboard" : "Sell on Venzorah"}
              </Link>
            </li>
            <li>
              <Link href="/p/faq" onClick={onClose} className="block py-2 text-sm font-semibold text-ink">
                Help Centre
              </Link>
            </li>
            {user ? (
              <li>
                <form action={logoutAction}>
                  <button type="submit" className="block py-2 text-sm font-bold text-error">
                    Sign out
                  </button>
                </form>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-navy/50 lg:hidden" role="dialog" aria-label={title}>
      <button type="button" className="absolute inset-0" aria-label={`Close ${title}`} onClick={onClose} />
      <div className="absolute inset-x-0 bottom-14 max-h-[70dvh] overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="tap-target text-ink" aria-label={`Close ${title}`}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DockLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: IconName;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "tap-target flex min-h-14 flex-col items-center justify-center text-[10px] font-semibold",
          active ? "text-navy" : "text-muted",
        )}
      >
        <DockIcon name={icon} active={active} />
        {label}
      </Link>
    </li>
  );
}

function DockButton({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: IconName;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={active}
        className={cn(
          "tap-target flex min-h-14 w-full flex-col items-center justify-center text-[10px] font-semibold",
          active ? "text-navy" : "text-muted",
        )}
      >
        <DockIcon name={icon} active={active} />
        {label}
      </button>
    </li>
  );
}

type IconName = "store" | "search" | "account" | "heart" | "menu";

function DockIcon({ name, active }: { name: IconName; active: boolean }) {
  const stroke = active ? 2.4 : 1.8;
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "store") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 10v10h14V10" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }
  if (name === "account") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
