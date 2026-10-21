import { PageHeader, TextLink } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <PageHeader title="You do not have access" description="This action is denied by server-side permissions, not by a hidden button." />
      <TextLink href="/">Return home</TextLink>
    </main>
  );
}
