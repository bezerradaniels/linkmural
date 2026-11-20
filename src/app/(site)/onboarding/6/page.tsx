import type { Metadata } from "next";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { requireOnboardingPage, toPreviewPage } from "@/lib/onboarding";
import { siteUrl } from "@/lib/redirect";
import type { TemplateKey } from "@/lib/styles";
import { TemplatePicker } from "./template-picker";

export const metadata: Metadata = {
  title: "Escolha o modelo · Onboarding",
  robots: { index: false, follow: false },
};

const TEMPLATE_KEYS: TemplateKey[] = ["balcao", "mosaico", "cartao"];

export default async function OnboardingStep6Page() {
  const { page } = await requireOnboardingPage("/onboarding/6");
  const pageUrl = `${siteUrl()}/${page.slug}`;

  const previews = {
    balcao: (
      <PublicPageView
        page={toPreviewPage(page, { template: "balcao" })}
        pageUrl={pageUrl}
        preview
      />
    ),
    mosaico: (
      <PublicPageView
        page={toPreviewPage(page, { template: "mosaico" })}
        pageUrl={pageUrl}
        preview
      />
    ),
    cartao: (
      <PublicPageView
        page={toPreviewPage(page, { template: "cartao" })}
        pageUrl={pageUrl}
        preview
      />
    ),
  };

  return (
    <TemplatePicker
      slug={page.slug}
      initialTemplate={
        TEMPLATE_KEYS.includes(page.template) ? page.template : "balcao"
      }
      previews={previews}
    />
  );
}
