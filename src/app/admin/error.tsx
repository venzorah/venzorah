"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-ink">This page needs the live database</h1>
      <p className="mt-2 text-sm text-muted">You are still signed in. Marketplace records appear once Postgres is connected.</p>
      <button type="button" onClick={() => reset()} className="mt-6 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
