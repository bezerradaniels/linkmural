import type { Metadata } from "next";
import { requireOnboardingPage } from "@/lib/onboarding";
import { LinksForm } from "./links-form";

export const metadata: Metadata = {
  title: "Primeiros links · Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingStep5Page() {
  const { page } = await requireOnboardingPage("/onboarding/5");

  const initialLinks = page.links.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon ?? "lm:link",
  }));

  return <LinksForm slug={page.slug} initialLinks={initialLinks} />;
}
