"use client";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-ink">This page couldn’t load</h1>
      <p className="mt-2 text-sm text-muted">The store could not reach its database. Reload to try again.</p>
      {error.digest ? <p className="mt-2 text-xs text-muted">Reference {error.digest}</p> : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
      >
        Reload
      </button>
    </main>
  );
}
