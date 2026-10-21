import type { ReactNode } from "react";
import { BrandMark } from "./brand";
import { ThemeToggle } from "./theme-toggle";

export function AuthScreen({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-navy px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandMark href="/" className="[&_span]:text-white" size={48} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Venzorah</p>
          <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-tight">
            African products.
            <br />
            Delivered in the UK.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            One account for shopping, selling and staff tools. Simple, secure and built for the marketplace.
          </p>
        </div>
        <p className="text-xs text-white/40">Shop food, fashion, beauty, art and more.</p>
      </section>
      <section className="relative flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark size={44} />
          </div>
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 space-y-2 text-sm text-muted">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
