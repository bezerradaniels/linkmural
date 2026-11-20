import type { Metadata } from "next";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { requireOnboardingPage, toPreviewPage } from "@/lib/onboarding";
import { siteUrl } from "@/lib/redirect";
import { PublishStep } from "./publish-step";

export const metadata: Metadata = {
  title: "Publicar página · Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingStep7Page() {
  const { page } = await requireOnboardingPage("/onboarding/7");
  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <PublishStep
      slug={page.slug}
      businessName={page.business_name || page.slug}
      preview={
        <PublicPageView page={toPreviewPage(page)} pageUrl={pageUrl} preview />
      }
    />
  );
}
