import type { Metadata } from "next";
import { requireOnboardingPage } from "@/lib/onboarding";
import { StylePicker } from "./style-picker";

export const metadata: Metadata = {
  title: "Escolha o estilo · Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingStep3Page() {
  const { page } = await requireOnboardingPage("/onboarding/3");

  return <StylePicker slug={page.slug} initialStyle={page.style} />;
}
