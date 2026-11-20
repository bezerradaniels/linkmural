import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { mediaUrl, type PublicLink, type PublicPage } from "@/lib/public-page";
import type { Plan } from "@/lib/plans";
import type { Tables } from "@/utils/supabase/types";

export type OnboardingPageRow = Tables<"pages"> & {
  links: Tables<"links">[];
};

/**
 * Loads the signed-in user's page for onboarding steps 3–7 and /pronto.
 * If the user has no page yet, redirects to /onboarding/iniciar.
 */
export async function requireOnboardingPage(stepPath: string) {
  const ctx = await requireUser(stepPath);
  const { data: page, error } = await ctx.supabase
    .from("pages")
    .select("*, links(*)")
    .eq("owner_id", ctx.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!page) redirect("/onboarding/iniciar");

  const sortedLinks = [...(page.links ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  return {
    ...ctx,
    page: { ...page, links: sortedLinks } as OnboardingPageRow,
  };
}

/** Converts an owner's page row into the PublicPage shape used by PublicPageView. */
export function toPreviewPage(
  page: OnboardingPageRow,
  overrides?: Partial<Pick<PublicPage, "template" | "style">>,
  plan: Plan = "free",
): PublicPage {
  const links: PublicLink[] = page.links
    .filter((l) => l.active)
    .sort((a, b) => a.position - b.position)
    .map((l) => ({
      id: l.id,
      kind: l.kind,
      title: l.title,
      subtitle: l.subtitle,
      url: l.url,
      icon: l.icon,
      featured: l.featured,
      position: l.position,
    }));

  return {
    id: page.id,
    slug: page.slug,
    template: overrides?.template ?? page.template,
    style: overrides?.style ?? page.style,
    theme: page.theme,
    business_name: page.business_name || page.slug,
    kind: page.kind,
    bio: page.bio,
    city: page.city,
    address: page.address,
    whatsapp: page.whatsapp,
    email: page.email,
    hours: page.hours,
    status_text: page.status_text,
    show_branding: page.show_branding,
    plan,
    avatarUrl: mediaUrl(page.avatar_path),
    coverUrl: mediaUrl(page.cover_path),
    links,
  };
}

/** Translates PostgreSQL trigger error messages into friendly pt-BR copy. */
export function friendlyDbError(message: string | undefined): string {
  if (!message) return "Não conseguimos salvar agora. Tente de novo.";
  if (message.includes("plan_limit_links")) {
    return "Sua página atingiu o limite de 5 links no plano Grátis. Salve até 5 agora e você pode editar depois no painel.";
  }
  if (message.includes("plan_limit_pages")) {
    return "Sua conta já atingiu o limite de páginas do plano atual.";
  }
  if (message.includes("slug_reserved")) {
    return "Esse endereço é reservado. Escolha outro nome.";
  }
  return "Não conseguimos salvar agora. Tente de novo em instantes.";
}
