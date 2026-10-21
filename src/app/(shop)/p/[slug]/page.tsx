import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CMS_PAGES } from "@/lib/cms-pages";
import { PageHeader } from "@/components/ui";

function Article({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title={title} />
      <article className="prose max-w-none whitespace-pre-wrap text-sm leading-7">{body}</article>
    </main>
  );
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const page = await prisma.cmsPage.findUnique({ where: { slug } });
    if (page) {
      if (page.status !== "PUBLISHED") notFound();
      return <Article title={page.title} body={page.body} />;
    }
  } catch (error) {
    console.error("CMS page fell back to built-in copy:", error instanceof Error ? error.message : error);
  }
  const fallback = CMS_PAGES[slug];
  if (!fallback) notFound();
  return <Article title={fallback.title} body={fallback.body} />;
}
