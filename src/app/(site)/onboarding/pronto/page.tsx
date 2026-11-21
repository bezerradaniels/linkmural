import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireOnboardingPage } from "@/lib/onboarding";
import {
  isPlanDestination,
  POST_ONBOARDING_COOKIE,
  safeNext,
  siteUrl,
} from "@/lib/redirect";
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
  const afterCookie = (await cookies()).get(POST_ONBOARDING_COOKIE)?.value;
  const parsedAfter = afterCookie ? safeNext(afterCookie, "/app") : "/app";
  const wantsPro = isPlanDestination(parsedAfter);

  return (
    <SuccessView
      pageId={page.id}
      slug={page.slug}
      businessName={page.business_name || page.slug}
      pageUrl={pageUrl}
      continueHref={wantsPro ? parsedAfter : "/app"}
      continueLabel={wantsPro ? "Continuar para o plano Pro" : "Ir para o painel"}
    />
  );
}
