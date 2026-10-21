"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/actions/marketplace";

export function FooterNewsletter() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(audience: "MALE" | "FEMALE") {
    const form = document.getElementById("footer-newsletter") as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    data.set("audience", audience);
    setError(null);
    setMessage(null);
    start(async () => {
      const result = await subscribeNewsletter(data);
      if (result.error) setError(result.error);
      else setMessage("You're subscribed to Venzorah offers.");
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10">
      <div className="flex flex-col gap-4 rounded-2xl bg-navy px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-extrabold text-navy">
              Ven<span className="text-gold-dark">Zorah</span>
            </span>
          </div>
          <div>
            <p className="text-sm font-bold">New to Venzorah?</p>
            <p className="text-xs text-white/75">Subscribe to our newsletter for updates on our latest offers.</p>
          </div>
        </div>
        <form id="footer-newsletter" className="flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={(e) => e.preventDefault()}>
          <label className="relative block min-w-[16rem] flex-1">
            <span className="sr-only">Email address</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">✉</span>
            <input
              name="email"
              type="email"
              required
              placeholder="Enter E-mail Address"
              className="h-10 w-full rounded-md border-0 bg-white pl-9 pr-3 text-sm text-navy outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("MALE")}
              className="h-10 min-w-20 rounded-md border border-white bg-transparent px-4 text-xs font-bold tracking-wide text-white hover:bg-white/10"
            >
              MALE
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("FEMALE")}
              className="h-10 min-w-20 rounded-md border border-white bg-transparent px-4 text-xs font-bold tracking-wide text-white hover:bg-white/10"
            >
              FEMALE
            </button>
          </div>
        </form>
      </div>
      {error ? <p className="mt-2 text-xs text-gold">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-gold">{message}</p> : null}
    </div>
  );
}
