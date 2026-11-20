import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { OnboardingPageRow } from "@/lib/onboarding";
import type { Plan } from "@/lib/plans";
import type { Tables } from "@/utils/supabase/types";

export type PanelProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "plan" | "role"
>;

export type PanelContext = {
  userId: string;
  email: string | null;
  profile: PanelProfile;
  page: OnboardingPageRow;
  plan: Plan;
};

/**
 * Loads the signed-in owner's profile and primary page once per request
 * (deduplicated with React cache across layout + page).
 * Redirects users who haven't finished onboarding to their saved step.
 */
export const getPanelContext = cache(async (): Promise<PanelContext> => {
  const { supabase, userId, email } = await requireUser("/app");

  const [profileRes, pageRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, plan, role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("pages")
      .select("*, links(*)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const page = pageRes.data;
  if (!page) {
    redirect("/onboarding/iniciar");
  }
  if (!page.published && page.onboarding_step < 8) {
    const step = Math.min(7, Math.max(3, page.onboarding_step));
    redirect(`/onboarding/${step}`);
  }

  const sortedLinks = [...(page.links ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const profile: PanelProfile = profileRes.data ?? {
    id: userId,
    full_name: null,
    email,
    plan: "free",
    role: "user",
  };

  return {
    userId,
    email: profile.email ?? email,
    profile,
    page: { ...page, links: sortedLinks } as OnboardingPageRow,
    plan: profile.plan ?? "free",
  };
});
