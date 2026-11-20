import type { Metadata } from "next";
import { AppearanceForm } from "@/components/app/AppearanceForm";
import { toPreviewPage } from "@/lib/onboarding";
import { getPanelContext } from "@/lib/panel-data";
import { siteUrl } from "@/lib/redirect";
import { parseTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Aparência",
};

export default async function AparenciaPage() {
  const { page, plan } = await getPanelContext();
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <AppearanceForm
      initialTemplate={page.template}
      initialStyle={page.style}
      initialTheme={parseTheme(page.theme)}
      initialShowBranding={page.show_branding}
      previewBase={toPreviewPage(page, undefined, plan)}
      pageUrl={pageUrl}
      plan={plan}
    />
  );
}
