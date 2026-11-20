import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { buttonClasses, Icon } from "@/components/ui";
import { toPreviewPage } from "@/lib/onboarding";
import { getPanelContext } from "@/lib/panel-data";
import { siteUrl } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Prévia",
};

/** Full-screen mobile preview of the user's page. */
export default async function PreviaPage() {
  const { page, plan } = await getPanelContext();
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/app/pagina"
          className={buttonClasses({ variant: "ghost", size: "md" })}
        >
          ← Voltar
        </Link>
        <span className="truncate text-small font-semibold">
          linkmural.com/{page.slug}
        </span>
        <Link
          href={`/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "outline", size: "md" })}
        >
          <Icon name="external" size={16} />
          Abrir
        </Link>
      </header>

      <div className="flex-1">
        <PublicPageView
          page={toPreviewPage(page, undefined, plan)}
          pageUrl={pageUrl}
          preview
        />
      </div>
    </div>
  );
}
