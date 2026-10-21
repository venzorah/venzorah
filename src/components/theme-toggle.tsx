"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      suppressHydrationWarning
      className={cn(
        "tap-target inline-flex items-center justify-center rounded-full border border-border bg-card px-3 text-xs font-semibold text-ink hover:bg-surface",
        className,
      )}
      aria-label={dark ? "Switch to light background" : "Switch to dark background"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span suppressHydrationWarning>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
