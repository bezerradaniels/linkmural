import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, buttonClasses } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { recordOnboardingEvent } from "@/lib/onboarding-events";
import { parseHoldCookie, SLUG_HOLD_COOKIE } from "@/lib/slug";
import { createAdminClient } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Preparando sua página · Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingStartPage() {
  const { supabase, userId } = await requireUser("/onboarding/iniciar");

  // 1. If the user already has a page, resume where they left off (or go to /app if published).
  const { data: existingPage } = await supabase
    .from("pages")
    .select("id, slug, published, onboarding_step")
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

  // 2. Otherwise, check the 30-minute hold cookie in slug_holds.
  const cookieStore = await cookies();
  const hold = parseHoldCookie(cookieStore.get(SLUG_HOLD_COOKIE)?.value);
  if (!hold) {
    redirect("/?aviso=escolha_endereco");
  }

  const admin = createAdminClient();
  const { data: holdRow } = await admin
    .from("slug_holds")
    .select("slug, token, expires_at")
    .eq("slug", hold.slug)
    .eq("token", hold.token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!holdRow) {
    redirect(`/?aviso=reserva_expirada&slug=${encodeURIComponent(hold.slug)}`);
  }

  // 3. Create the page with the reserved slug (onboarding_step = 3).
  const { data: created, error } = await supabase
    .from("pages")
    .insert({
      owner_id: userId,
      slug: hold.slug,
      style: "classic",
      template: "balcao",
      onboarding_step: 3,
      published: false,
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    const msg = error?.message ?? "";
    if (msg.includes("plan_limit_pages")) {
      return (
        <OnboardingShell
          title="Limite de páginas atingido"
          subtitle="Sua conta já tem o número máximo de páginas do plano atual."
        >
          <Alert tone="warning" title="Você já tem uma página ativa">
            Acesse o painel para editar sua página existente.
          </Alert>
          <Link
            href="/app"
            className={buttonClasses({
              variant: "primary",
              size: "lg",
              className: "w-full",
            })}
          >
            Ir para o painel
          </Link>
        </OnboardingShell>
      );
    }

    // Unique violation (23505) or reserved slug → back to step 1 with warning and suggestions.
    redirect(`/?aviso=endereco_ocupado&slug=${encodeURIComponent(hold.slug)}`);
  }

  // 4. Delete the temporary hold and record conta_criada.
  await admin.from("slug_holds").delete().eq("slug", hold.slug);

  recordOnboardingEvent({
    event: "conta_criada",
    userId,
    pageId: created.id,
    slug: created.slug,
  });

  redirect("/onboarding/3");
}
