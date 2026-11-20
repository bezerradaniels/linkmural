import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { getPublicPage } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";

// Rendered on first visit, then cached (ISR). The data itself is cached per
// page tag and refreshed with revalidateTag when the owner saves.
export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page)
    return { title: "Página não encontrada", robots: { index: false } };

  const name = page.business_name.trim() || page.slug;
  const url = `${siteUrl()}/${page.slug}`;
  const description = page.bio ?? page.kind ?? `${name} no linkmural.`;
  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} · linkmural`,
      description,
      url,
      type: "profile",
      siteName: "linkmural",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} · linkmural`,
      description,
    },
  };
}

export default async function PublicPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) notFound();
  return <PublicPageView page={page} pageUrl={`${siteUrl()}/${page.slug}`} />;
}
