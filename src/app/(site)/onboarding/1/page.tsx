import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { finalizeSlug } from "@/lib/slug";
import { SlugStepForm } from "./slug-step-form";

export const metadata: Metadata = {
  title: "Escolha seu endereço · Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingStep1Page({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const [{ supabase, userId }, params] = await Promise.all([
    requireUser("/onboarding/1"),
    searchParams,
  ]);

  const { data: existingPage } = await supabase
    .from("pages")
    .select("id, published, onboarding_step")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingPage) {
    if (existingPage.published || existingPage.onboarding_step >= 8) {
      redirect("/app");
    }
    const step = Math.min(7, Math.max(3, existingPage.onboarding_step));
    redirect(`/onboarding/${step}`);
  }

  const initialSlug = params.slug ? finalizeSlug(params.slug) : "";
  return <SlugStepForm initialSlug={initialSlug} />;
}
