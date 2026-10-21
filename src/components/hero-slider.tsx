"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  title: string;
  kicker?: string;
  body?: string;
  href: string;
  image: string;
  cta?: string;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  if (!slides.length) return null;
  const slide = slides[index] ?? slides[0];

  return (
    <section
      className="relative min-h-[20rem] overflow-hidden rounded-3xl bg-[#1a3a7a] text-white sm:min-h-[22rem] lg:min-h-[24rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured Venzorah collections"
    >
      <div className="pointer-events-none absolute -right-16 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-4 top-1/2 h-[20rem] w-[20rem] -translate-y-1/2 rounded-full border border-white/10" />

      {slides.map((item, i) => (
        <div
          key={`${item.title}-${i}`}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === index ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt="" className="h-full w-full object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,33,104,0.62)_0%,rgba(0,33,104,0.28)_36%,rgba(0,33,104,0.08)_68%,rgba(0,33,104,0.02)_100%)]" />
        </div>
      ))}

      <div className="relative z-10 flex h-full min-h-[20rem] max-w-lg flex-col justify-center px-6 py-8 sm:min-h-[22rem] sm:px-8 lg:min-h-[24rem] lg:px-10 [text-shadow:0_1px_10px_rgba(0,19,61,0.45)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          {slide.kicker ?? "Exclusive offer this week"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{slide.title}</h1>
        {slide.body ? <p className="mt-3 max-w-sm text-sm text-white/90">{slide.body}</p> : null}
        <Link
          href={slide.href}
          className="tap-target mt-6 inline-flex w-fit items-center gap-1 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gold-dark"
        >
          {slide.cta ?? "Shop now"} <span aria-hidden>›</span>
        </Link>
      </div>

      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
          {slides.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Show slide ${i + 1}: ${item.title}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-2 rounded-full transition",
                i === index ? "w-7 bg-gold" : "w-2 bg-white/40 hover:bg-white",
              )}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
