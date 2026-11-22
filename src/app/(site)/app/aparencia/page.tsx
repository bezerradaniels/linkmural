import type { Metadata } from "next";
import { AppearanceForm } from "@/components/app/AppearanceForm";
import { toPreviewPage } from "@/lib/onboarding";
import { getPanelContext } from "@/lib/panel-data";
import { mediaUrl } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";
import { parseTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Aparência",
};

export default async function AparenciaPage() {
  const { userId, page, plan } = await getPanelContext();
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <AppearanceForm
      userId={userId}
      pageId={page.id}
      initialTemplate={page.template}
      initialStyle={page.style}
      initialTheme={parseTheme(page.theme)}
      initialShowBranding={page.show_branding}
      initialAvatarPath={page.avatar_path ?? ""}
      initialAvatarUrl={mediaUrl(page.avatar_path)}
      initialCoverPath={page.cover_path ?? ""}
      initialCoverUrl={mediaUrl(page.cover_path)}
      previewBase={toPreviewPage(page, undefined, plan)}
      pageUrl={pageUrl}
      plan={plan}
    />
  );
}
