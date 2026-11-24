import type { Metadata } from "next";
import Link from "next/link";
import { LinksEditor } from "@/components/app/LinksEditor";
import { Icon } from "@/components/ui";
import { toPreviewPage } from "@/lib/onboarding";
import { getPanelContext } from "@/lib/panel-data";
import { siteUrl } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Página",
};

export default async function PaginaPage() {
  const { userId, page, plan, downgraded } = await getPanelContext();
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-paper shadow-sm">
        <div className="min-w-0">
          <p className="m-0 font-display text-body font-semibold text-paper">
            Editor Visual em tela cheia
          </p>
          <p className="m-0 text-caption text-paper/70">
            Arraste, redimensione pelos 4 cantos, crie pilhas e personalize em
            tempo real.
          </p>
        </div>
        <Link
          href={`/editor/${page.id}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-lime px-4 text-small font-semibold text-on-lime transition-opacity hover:opacity-90"
        >
          <Icon name="edit" size={16} />
          <span>Editar mural</span>
        </Link>
      </div>

      <LinksEditor
        userId={userId}
        initialLinks={page.links}
        previewBase={toPreviewPage(page, undefined, plan)}
        pageUrl={pageUrl}
        plan={plan}
        downgraded={downgraded}
      />
    </div>
  );
}
