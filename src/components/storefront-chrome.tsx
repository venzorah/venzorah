import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "./brand";
import { FooterNewsletter } from "./footer-newsletter";
import { ThemeToggle } from "./theme-toggle";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dbErrorText, ensureDemoCatalog } from "@/lib/ensure-catalog";
import { ROLE_KEYS } from "@/lib/permissions";

async function loadHeader() {
  const ready = await ensureDemoCatalog();
  if (!ready) return { user: null, categories: [], cartCount: 0 };
  const user = await getSessionUser();
  const categories = await prisma.category.findMany({
    where: { enabled: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 24,
  });
  const cartCount = user ? await prisma.cartItem.count({ where: { cart: { userId: user.id } } }) : 0;
  return { user, categories, cartCount };
}

export async function StorefrontHeader() {
  const loaded = await loadHeader().catch((error) => {
    console.error("Storefront header skipped the database:", dbErrorText(error));
    return { user: null, categories: [], cartCount: 0 };
  });
  const { user, categories, cartCount } = loaded;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <BrandMark size={48} className="[&_span]:text-xl" />
        <form action="/search" className="hidden min-w-0 flex-1 max-w-xl md:block">
          <label className="sr-only" htmlFor="q">
            Search African products
          </label>
          <input
            id="q"
            name="q"
            placeholder="Search food, fashion, beauty, art…"
            className="tap-target w-full rounded-full border border-border bg-surface px-4 text-sm"
          />
        </form>
        <nav className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Link className="tap-target hidden items-center px-2 sm:inline-flex" href="/sell-on-venzorah">
            Sell on Venzorah
          </Link>
          <Link className="tap-target hidden items-center px-2 sm:inline-flex" href="/products">
            Shop
          </Link>
          <Link className="tap-target inline-flex items-center px-2" href="/cart">
            Cart{cartCount ? ` (${cartCount})` : ""}
          </Link>
          {user ? (
            <>
              {user.roles.includes(ROLE_KEYS.ADMIN) ? (
                <Link className="tap-target hidden items-center px-2 sm:inline-flex" href="/admin">
                  Admin
                </Link>
              ) : null}
              {user.vendorId ? (
                <Link className="tap-target hidden items-center px-2 sm:inline-flex" href="/vendor">
                  Vendor
                </Link>
              ) : null}
              <Link className="tap-target inline-flex items-center rounded-full bg-navy px-3 py-2 text-white" href="/account">
                Account
              </Link>
            </>
          ) : (
            <Link className="tap-target inline-flex items-center rounded-full bg-gold px-3 py-2 text-navy" href="/login">
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
      <div className="overflow-x-auto border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl gap-1 px-2 py-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/categories" className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-gold-dark">
            All categories
          </Link>
        </div>
      </div>
      <form action="/search" className="border-t border-border px-4 py-2 md:hidden">
        <input
          name="q"
          placeholder="Search products"
          className="tap-target w-full rounded-full border border-border bg-surface px-4 text-sm"
        />
      </form>
    </header>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-white">{children}</p>;
}

function FooterLinks({ items }: { items: { href: string; label: string }[] }) {
  return (
    <ul className="mt-4 grid gap-2.5 text-[13px] text-white/70">
      {items.map((item) => (
        <li key={item.label}>
          <Link href={item.href} className="hover:text-white">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <FooterNewsletter />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <FooterHeading>Need Help?</FooterHeading>
          <FooterLinks
            items={[
              { href: "/p/faq", label: "Help Centre" },
              { href: "/account/orders", label: "Track Your Order" },
              { href: "/p/contact", label: "Contact Us" },
              { href: "/p/faq", label: "How to shop on Venzorah?" },
              { href: "/p/shipping", label: "Delivery options and timelines" },
              { href: "/p/returns", label: "How to return a product on Venzorah?" },
              { href: "/p/contact", label: "Corporate and bulk purchases" },
              { href: "/p/contact", label: "Report a Product" },
            ]}
          />
        </div>
        <div>
          <FooterHeading>About Venzorah</FooterHeading>
          <FooterLinks
            items={[
              { href: "/p/about", label: "About us" },
              { href: "/p/contact", label: "Venzorah careers" },
              { href: "/p/shipping", label: "Venzorah Express" },
              { href: "/p/terms", label: "Terms and Conditions" },
              { href: "/p/privacy", label: "Privacy Notice" },
              { href: "/p/returns", label: "Returns & Refund Policy" },
              { href: "/p/privacy", label: "Cookie Policy" },
              { href: "/p/subscription-terms", label: "Venzorah Store Credit Terms" },
              { href: "/products", label: "Flash Sales" },
            ]}
          />
        </div>
        <div>
          <FooterHeading>Make Money with Venzorah</FooterHeading>
          <FooterLinks
            items={[
              { href: "/sell-on-venzorah", label: "Sell on Venzorah" },
              { href: "/vendor", label: "Vendor hub" },
              { href: "/sell-on-venzorah#register", label: "Become a Sales Consultant" },
              { href: "/p/contact", label: "Become a Logistics Service Partner" },
              { href: "/p/about", label: "Join the Venzorah Academy" },
            ]}
          />
        </div>
        <div>
          <FooterHeading>Venzorah International</FooterHeading>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] text-white/70">
            {["Ghana", "Nigeria", "Kenya", "South Africa", "Uganda", "Senegal", "Morocco", "Egypt", "Ivory Coast", "Tunisia"].map(
              (country) => (
                <li key={country}>
                  <Link href="/products" className="hover:text-white">
                    {country}
                  </Link>
                </li>
              ),
            )}
          </ul>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">Download our app</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex flex-col rounded-md bg-black px-3 py-1.5 leading-none ring-1 ring-white/20"
            >
              <span className="text-[10px] text-white/80">Download on the</span>
              <span className="mt-0.5 text-sm font-semibold">App Store</span>
            </Link>
            <Link
              href="/"
              className="inline-flex flex-col rounded-md bg-black px-3 py-1.5 leading-none ring-1 ring-white/20"
            >
              <span className="text-[10px] text-white/80">GET IT ON</span>
              <span className="mt-0.5 text-sm font-semibold">Google Play</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">Join us on</p>
            <div className="mt-3 flex gap-2">
              {[
                { href: "https://www.facebook.com/", label: "Facebook" },
                { href: "https://x.com/", label: "X" },
                { href: "https://www.instagram.com/", label: "Instagram" },
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold"
                >
                  {social.label.slice(0, 1)}
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              Payment methods & delivery partners
            </p>
            <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
              {["VISA", "Mastercard", "Apple Pay", "Royal Mail", "UPS"].map((name) => (
                <span
                  key={name}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-navy"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
