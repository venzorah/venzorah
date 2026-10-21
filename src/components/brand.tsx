import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = 40,
  href = "/",
  withWord = true,
}: {
  className?: string;
  size?: number;
  href?: string;
  withWord?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} aria-label="Venzorah home">
      {/* Native img avoids next/image hydration mismatches in the PWA shell. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-wordmark.png"
        alt=""
        className="h-9 w-auto max-w-[min(11.5rem,calc(100vw-9rem))] rounded-md bg-white px-1.5 py-0.5 object-contain object-left ring-1 ring-black/5 sm:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.png"
        alt=""
        width={size}
        height={size}
        className="hidden rounded-lg sm:inline"
      />
      {withWord ? (
        <span className="hidden text-lg font-extrabold tracking-tight text-ink sm:inline">
          Ven<span className="text-gold-dark">Zorah</span>
        </span>
      ) : null}
    </Link>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    // Official wordmark is a wide PNG with a dark field; use a native img so it always paints.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-wordmark.png"
      alt="Venzorah — Shop Product and Services"
      className={cn("h-auto w-full max-w-md object-contain", className)}
    />
  );
}
