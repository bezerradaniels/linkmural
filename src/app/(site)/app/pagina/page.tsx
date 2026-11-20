import type { Metadata } from "next";
import { LinksEditor } from "@/components/app/LinksEditor";
import { toPreviewPage } from "@/lib/onboarding";
import { getPanelContext } from "@/lib/panel-data";
import { siteUrl } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Página",
};

export default async function PaginaPage() {
  const { page, plan } = await getPanelContext();
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <LinksEditor
      initialLinks={page.links}
      previewBase={toPreviewPage(page, undefined, plan)}
      pageUrl={pageUrl}
      plan={plan}
    />
  );
}
