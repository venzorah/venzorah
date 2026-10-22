import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoArticle } from "@/components/info-article";
import { INFO_BY_SLUG } from "@/lib/info-pages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = INFO_BY_SLUG[slug];
  if (!page) return { title: "Venzorah" };
  return { title: page.title, description: page.summary };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = INFO_BY_SLUG[slug];
  if (!page) notFound();
  return <InfoArticle page={page} />;
}
