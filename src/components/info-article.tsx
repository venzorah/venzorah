import Link from "next/link";
import type { InfoPage } from "@/lib/info-pages";

export function InfoArticle({ page }: { page: InfoPage }) {
  return (
    <main>
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{page.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{page.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">{page.summary}</p>
          <p className="mt-6 text-xs text-white/60">Published 22 October 2026</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-10">
        {page.sections.map((section) => (
          <section key={section.heading} id={section.id} className="scroll-mt-24">
            <h2 className="border-b-2 border-navy pb-2 text-xl font-bold text-navy">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-ink">
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink">
                {section.bullets.map((item) => (
                  <li key={item} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.faqs?.length ? (
              <div className="mt-3 grid gap-2">
                {section.faqs.map((item) => (
                  <details key={item.q} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-border open:ring-navy">
                    <summary className="cursor-pointer font-semibold text-ink">{item.q}</summary>
                    <p className="mt-2 text-sm leading-7 text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            ) : null}
          </section>
        ))}
        {page.links?.length ? (
          <nav className="flex flex-wrap gap-2">
            {page.links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-navy ring-1 ring-border">
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
