"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { friendlyDbError } from "@/lib/onboarding";
import { planInfo } from "@/lib/plans";
import { STYLE_KEYS, type StyleKey } from "@/lib/styles";
import { themeSchema } from "@/lib/theme";
import type { ActionResult } from "./links";
import { refreshPublicPage } from "./revalidate";

const appearanceSchema = z.object({
  template: z.enum(["balcao", "mosaico", "cartao"]),
  style: z.enum(STYLE_KEYS as [StyleKey, ...StyleKey[]]),
  theme: themeSchema,
  show_branding: z.boolean(),
});

export async function saveAppearanceAction(
  input: z.input<typeof appearanceSchema>,
): Promise<ActionResult> {
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Confira as opções de aparência escolhidas.",
    };
  }

  const { supabase, userId } = await requireUser("/app/aparencia");

  const [profileRes, pageRes] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    supabase
      .from("pages")
      .select("id, slug")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const page = pageRes.data;
  if (!page) return { ok: false, error: "Página não encontrada." };

  const plan = planInfo(profileRes.data?.plan);

  // Server-side plan guard: on Free, only iconColor is persisted in theme
  // and show_branding is always true (DB trigger also enforces it).
  const safeTheme = plan.customTheme
    ? parsed.data.theme
    : { iconColor: parsed.data.theme.iconColor ?? "brand" };

  const { error } = await supabase
    .from("pages")
    .update({
      template: parsed.data.template,
      style: parsed.data.style,
      theme: safeTheme,
      show_branding: plan.removeBranding ? parsed.data.show_branding : true,
    })
    .eq("id", page.id);

  if (error) return { ok: false, error: friendlyDbError(error.message) };

  refreshPublicPage(page.slug);
  return { ok: true };
}
