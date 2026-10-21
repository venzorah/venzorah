import { PageHeader } from "@/components/ui";

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <PageHeader
        title="You are offline"
        description="Cached pages may still open, but checkout, payments, stock changes, refunds, subscriptions and payouts require a live connection."
      />
    </main>
  );
}
