import Link from "next/link";
import type { AuthPortal, OAuthProvider } from "@/lib/oauth";

const PROVIDERS: { id: OAuthProvider; label: string; icon: string }[] = [
  {
    id: "google",
    label: "Google",
    icon: "M21.35 11.1H12.2v2.8h5.3c-.2 1.4-1.6 4-5.3 4-3.2 0-5.8-2.6-5.8-5.9s2.6-5.9 5.8-5.9c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.6 14.6 2.6 12.2 2.6 6.9 2.6 2.6 6.9 2.6 12.2s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1-.2-1.3z",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "M13.5 21v-7.2h2.4l.4-2.8h-2.8V9.3c0-.8.2-1.4 1.4-1.4h1.5V5.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.7H8v2.8h2.3V21h3.2z",
  },
  {
    id: "apple",
    label: "Apple ID",
    icon: "M16.2 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8s-1.6-.7-2.7-.7c-1.4 0-2.6.8-3.3 2.1-1.4 2.5-.4 6.1 1 8.1.7 1 1.5 2.1 2.6 2 1 .1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.2s-2.2-.8-2.3-3.2zm-2.1-6.2c.6-.7 1-1.7.8-2.7-0.8.1-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.8-.4 2.4-1.1z",
  },
];

export function SocialLoginButtons({ portal }: { portal: AuthPortal }) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Or continue with
      </p>
      <div className="grid gap-2">
        {PROVIDERS.map((provider) => (
          <Link
            key={provider.id}
            href={`/api/auth/oauth/${provider.id}?portal=${portal}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-ink hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d={provider.icon} />
            </svg>
            Continue with {provider.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
