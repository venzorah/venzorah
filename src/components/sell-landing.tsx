import Link from "next/link";
import { registerVendor } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { Button, Field, Input } from "@/components/ui";
import { formatGbp } from "@/lib/money";

const BENEFITS = [
  {
    title: "UK reach",
    body: "Sell African products to customers across the United Kingdom from one storefront.",
    icon: "◎",
  },
  {
    title: "Secure payments",
    body: "Orders are paid into the Venzorah ledger. Vendor earnings stay on hold until delivery is complete.",
    icon: "▣",
  },
  {
    title: "Logistics support",
    body: "Set your own shipping zones and rates, or use carriers already configured for UK delivery.",
    icon: "▤",
  },
  {
    title: "Vendor tools",
    body: "Manage listings, inventory, orders, KYC and payouts from your vendor dashboard.",
    icon: "▦",
  },
];

const STEPS = [
  { title: "Register", body: "Create your vendor account with a UK business location." },
  { title: "Verify", body: "Complete KYC so customers can trust your store." },
  { title: "List products", body: "Upload photos, prices and stock. Free plan includes 5 live listings." },
  { title: "Start selling", body: "Receive orders, fulfil them, and grow with Venzorah." },
];

const FAQS = [
  {
    q: "How much does it cost to sell on Venzorah?",
    a: "Opening a vendor account is free. The Free plan allows 5 live listings at 5% commission on product sales. A paid plan charges no commission while it is active. Shipping fees are paid to you in full.",
  },
  {
    q: "When do I receive my payments?",
    a: "Earnings stay on hold until the order is delivered and the return window ends. You can then request a payout to your UK account.",
  },
  {
    q: "Who handles shipping?",
    a: "You set zones and rates for your store. Checkout only offers destinations you can serve. Carriers such as Royal Mail and UPS are supported.",
  },
  {
    q: "What documents do I need?",
    a: "UK vendors complete Sylmera Identity checks: photo ID for individual sellers, or Companies House plus ID for a registered business.",
  },
];

export function SellLanding({
  vendorCount,
  payoutPence,
}: {
  vendorCount: number;
  payoutPence: number;
}) {
  return (
    <main className="bg-background text-ink">
      <div className="sticky top-[7.5rem] z-30 hidden border-b border-border/70 bg-card/90 backdrop-blur lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs font-semibold tracking-wide">
          <p className="text-muted">
            Merchant <span className="text-ink">center</span>
          </p>
          <nav className="flex items-center gap-6 text-muted">
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">How it works</a>
            <a href="#stories">Testimonials</a>
            <a href="#faqs">FAQs</a>
            <Link href="/login" className="text-ink">
              Login
            </Link>
            <a href="#register" className="rounded-full bg-navy px-4 py-2 text-white">
              Start selling
            </a>
          </nav>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="inline-flex rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-dark">
            Official merchant partner
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Sell more.
            <br />
            Grow faster.
            <br />
            <span className="text-navy-deep">Reach the UK.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            Join African entrepreneurs already building on Venzorah. We provide the marketplace, payments and UK
            delivery tools; you bring the products.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#register"
              className="tap-target inline-flex items-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white"
            >
              Join now →
            </a>
            <Link
              href="/login"
              className="tap-target inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink"
            >
              Seller login
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["/categories/cat-food.jpg", "/categories/cat-fashion.jpg", "/categories/cat-beauty.jpg", "/categories/cat-bags.jpg"].map(
                (src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  />
                ),
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {`${Math.max(vendorCount, 2)}+`} active merchants
            </p>
          </div>
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/slides/merchant-hero.jpg"
            alt="Venzorah merchant in store"
            className="h-[22rem] w-full rounded-[2rem] object-cover shadow-xl sm:h-[28rem]"
          />
          <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success">
              ✓
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Total paid on platform</p>
              <p className="text-sm font-extrabold">{formatGbp(payoutPence || 28450)}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold">The merchant advantage</h2>
          <p className="mt-2 text-sm text-muted">
            A frictionless, secure way for African businesses to sell into the UK.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4ead4] text-gold-dark">
                {item.icon}
              </span>
              <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold">How to get started</h2>
          <p className="mt-2 text-sm text-muted">Four steps to launching your UK storefront.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <article key={step.title} className="text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/slides/slide-fashion.jpg" alt="" className="h-56 w-full rounded-3xl object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/slides/slide-market.jpg" alt="" className="mt-8 h-56 w-full rounded-3xl object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">Empowering African brands to sell in the UK.</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Venzorah is a UK-first marketplace for African food, fashion, beauty, art and more. You keep your brand;
            we handle storefront, checkout and settlement.
          </p>
          <ul className="mt-6 grid gap-2 text-sm">
            {[
              "Vendor-controlled shipping zones",
              "Ledger-protected payouts",
              "Dedicated vendor dashboard",
              "UK customer reach",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-gold-dark">●</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#register"
            className="tap-target mt-6 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy"
          >
            Get started today
          </a>
        </div>
      </section>

      <section id="stories" className="px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold">Voices of success</h2>
          <p className="mt-2 text-sm text-muted">Vendors already using Venzorah to reach UK customers.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2">
          {[
            {
              quote:
                "Listing our pantry staples on Venzorah made UK orders simple. The dashboard is clear and payouts follow delivery.",
              name: "Adaeze Mensah",
              store: "Mama Ada's Pantry Ltd",
            },
            {
              quote:
                "We now ship Ankara pieces across the UK from one store. Customers find us without us running a separate website.",
              name: "Kofi Boateng",
              store: "Steel City African Store Ltd",
            },
          ].map((item) => (
            <blockquote key={item.name} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed">“{item.quote}”</p>
              <footer className="mt-4">
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-xs text-muted">{item.store}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="faqs" className="bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold">Everything you need to know</h2>
          <p className="mt-2 text-sm text-muted">Answered for UK vendors on Venzorah.</p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="rounded-2xl border border-border bg-[#f7f4ef] px-5 py-4">
              <summary className="cursor-pointer font-semibold">{item.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-navy px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Limited time: free registration</p>
          <h2 className="mt-3 text-4xl font-extrabold">Your future starts here.</h2>
          <p className="mt-3 text-sm text-white/75">
            Open a UK vendor store today. Free plan, then grow into a paid subscription when you need more listings.
          </p>
          <a
            href="#register"
            className="tap-target mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy"
          >
            Open your store now
          </a>
        </div>
      </section>

      <section id="register" className="mx-auto max-w-lg px-4 py-16">
        <h2 className="text-2xl font-extrabold">Create your vendor account</h2>
        <p className="mt-2 text-sm text-muted">UK businesses only. You will be signed in and sent to KYC next.</p>
        <ActionForm action={registerVendor} className="mt-6 grid gap-3 rounded-[1.75rem] bg-white p-5 shadow-sm">
          <Field label="Your name">
            <Input name="name" required />
          </Field>
          <Field label="Business email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Password">
            <PasswordInput name="password" minLength={10} required autoComplete="new-password" />
          </Field>
          <Field label="Store name">
            <Input name="storeName" required />
          </Field>
          <input type="hidden" name="country" value="GB" />
          <Button type="submit">Create vendor account</Button>
        </ActionForm>
      </section>
    </main>
  );
}
