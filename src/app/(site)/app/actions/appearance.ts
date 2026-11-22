"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { friendlyDbError } from "@/lib/onboarding";
import { planInfo } from "@/lib/plans";
import { STYLE_KEYS, type StyleKey } from "@/lib/styles";
import { themeSchema } from "@/lib/theme";
import type { TablesUpdate } from "@/utils/supabase/types";
import type { ActionResult } from "./links";
import { refreshPublicPage } from "./revalidate";

const appearanceSchema = z.object({
  template: z.enum(["balcao", "mosaico", "cartao"]),
  style: z.enum(STYLE_KEYS as [StyleKey, ...StyleKey[]]),
  theme: themeSchema,
  show_branding: z.boolean(),
  avatar_path: z.string().trim().max(300).optional(),
  cover_path: z.string().trim().max(300).optional(),
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

  if (
    parsed.data.avatar_path &&
    !parsed.data.avatar_path.startsWith(`${userId}/`)
  ) {
    return { ok: false, error: "Caminho do logo inválido." };
  }
  if (
    parsed.data.cover_path &&
    !parsed.data.cover_path.startsWith(`${userId}/`)
  ) {
    return { ok: false, error: "Caminho da capa inválido." };
  }

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

  // Server-side plan guard:
  // - Free keeps font, palette/background/accent, solid/gradient bg, iconColor, and header (logo/cover) settings.
  // - Pro+ unlocks doodles/image backgrounds, cardEffect, cardSize, cardFill, radius and show_branding.
  const t = parsed.data.theme;
  const safeTheme = plan.customTheme
    ? t
    : {
        iconColor: t.iconColor ?? "brand",
        ...(t.font ? { font: t.font } : {}),
        ...(t.palette ? { palette: t.palette } : {}),
        ...(t.background ? { background: t.background } : {}),
        ...(t.accent ? { accent: t.accent } : {}),
        ...(t.bgType === "solid" || t.bgType === "gradient"
          ? { bgType: t.bgType }
          : {}),
        ...(t.bgGradient ? { bgGradient: t.bgGradient } : {}),
        ...(t.coverHeight ? { coverHeight: t.coverHeight } : {}),
        ...(t.coverStyle ? { coverStyle: t.coverStyle } : {}),
        ...(t.logoShape ? { logoShape: t.logoShape } : {}),
        ...(t.logoSize ? { logoSize: t.logoSize } : {}),
        ...(t.headerAlign ? { headerAlign: t.headerAlign } : {}),
      };

  const patch: TablesUpdate<"pages"> = {
    template: parsed.data.template,
    style: parsed.data.style,
    theme: safeTheme,
    show_branding: plan.removeBranding ? parsed.data.show_branding : true,
  };
  if (parsed.data.avatar_path !== undefined) {
    patch.avatar_path = parsed.data.avatar_path || null;
  }
  if (parsed.data.cover_path !== undefined) {
    patch.cover_path = parsed.data.cover_path || null;
  }

  const { error } = await supabase
    .from("pages")
    .update(patch)
    .eq("id", page.id);

  if (error) return { ok: false, error: friendlyDbError(error.message) };

  refreshPublicPage(page.slug);
  return { ok: true };
}
