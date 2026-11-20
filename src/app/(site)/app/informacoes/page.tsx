import type { Metadata } from "next";
import { InfoForm } from "@/components/app/InfoForm";
import { toPreviewPage } from "@/lib/onboarding";
import { getPanelContext } from "@/lib/panel-data";
import { mediaUrl } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Informações",
};

export default async function InformacoesPage() {
  const { userId, page, plan } = await getPanelContext();
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <InfoForm
      userId={userId}
      pageId={page.id}
      initialSlug={page.slug}
      initialBusinessName={page.business_name}
      initialKind={page.kind ?? ""}
      initialBio={page.bio ?? ""}
      initialAvatarPath={page.avatar_path ?? ""}
      initialAvatarUrl={mediaUrl(page.avatar_path)}
      initialWhatsapp={page.whatsapp ?? ""}
      initialPhone={page.phone ?? ""}
      initialEmail={page.email ?? ""}
      initialAddress={page.address ?? ""}
      initialCity={page.city ?? ""}
      initialHours={page.hours}
      previewBase={toPreviewPage(page, undefined, plan)}
      pageUrl={pageUrl}
    />
  );
}
