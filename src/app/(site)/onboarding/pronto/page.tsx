import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOnboardingPage } from "@/lib/onboarding";
import { siteUrl } from "@/lib/redirect";
import { SuccessView } from "./success-view";

export const metadata: Metadata = {
  title: "Página publicada · Linkmural",
  robots: { index: false, follow: false },
};

export default async function OnboardingSuccessPage() {
  const { page } = await requireOnboardingPage("/onboarding/pronto");

  if (!page.published) {
    redirect("/onboarding/7");
  }

  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <SuccessView
      pageId={page.id}
      slug={page.slug}
      businessName={page.business_name || page.slug}
      pageUrl={pageUrl}
    />
  );
}
