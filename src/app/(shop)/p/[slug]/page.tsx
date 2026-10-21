import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISHED") notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title={page.title} />
      <article className="prose max-w-none whitespace-pre-wrap text-sm leading-7">{page.body}</article>
    </main>
  );
}
