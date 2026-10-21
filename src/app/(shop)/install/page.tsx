import { PageHeader } from "@/components/ui";

export default function InstallPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        title="Install Venzorah"
        description="Venzorah is an installable PWA. Some browsers show an Install button automatically; others need a manual Add to Home Screen step."
      />
      <ol className="grid gap-3 text-sm">
        <li className="rounded-2xl border border-border bg-card p-4">
          <strong>Android Chrome:</strong> use the Install banner, or Menu → Install app.
        </li>
        <li className="rounded-2xl border border-border bg-card p-4">
          <strong>iPhone / iPad Safari:</strong> Share → Add to Home Screen. iOS does not expose a web install prompt.
        </li>
        <li className="rounded-2xl border border-border bg-card p-4">
          <strong>Desktop Chrome/Edge:</strong> install icon in the address bar.
        </li>
      </ol>
    </main>
  );
}
