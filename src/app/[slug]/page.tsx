import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { getPublicPage, isSlugBlocked } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";
import { isEmptyPublicPage } from "@/lib/seo";

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
    ...(isEmptyPublicPage(page)
      ? { robots: { index: false, follow: true } }
      : {}),
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
  if (!page) {
    if (await isSlugBlocked(slug)) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-paper px-6 text-center text-ink">
          <Link href="/" aria-label="linkmural">
            <Image
              src="/brand/linkmural-logo.svg"
              alt="Linkmural"
              width={160}
              height={24}
            />
          </Link>
          <h1 className="font-display text-display-md tracking-[-0.03em]">
            Esta página está indisponível
          </h1>
          <p className="max-w-sm text-body text-ink-muted">
            O conteúdo deste endereço foi suspenso pela moderação do linkmural.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-pill bg-ink px-5 text-small font-semibold text-paper no-underline"
          >
            Ir para linkmural.com
          </Link>
        </main>
      );
    }
    notFound();
  }
  return <PublicPageView page={page} pageUrl={`${siteUrl()}/${page.slug}`} />;
}
