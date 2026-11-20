import type { Metadata } from "next";
import { requireOnboardingPage } from "@/lib/onboarding";
import { mediaUrl } from "@/lib/public-page";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = {
  title: "Dados do negócio · Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingStep4Page() {
  const { userId, page } = await requireOnboardingPage("/onboarding/4");

  return (
    <BusinessForm
      userId={userId}
      pageId={page.id}
      slug={page.slug}
      initialName={page.business_name}
      initialWhatsapp={page.whatsapp ?? ""}
      initialCity={page.city ?? ""}
      initialAvatarPath={page.avatar_path ?? ""}
      initialAvatarUrl={mediaUrl(page.avatar_path)}
    />
  );
}
