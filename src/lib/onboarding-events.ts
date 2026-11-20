import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Json } from "@/utils/supabase/types";

export type OnboardingEventName =
  | "slug_escolhido"
  | "conta_criada"
  | "estilo_escolhido"
  | "dados_salvos"
  | "links_adicionados"
  | "modelo_escolhido"
  | "pagina_publicada"
  | "link_copiado"
  | "qr_baixado";

let warned = false;

/**
 * Records an onboarding funnel event in `onboarding_events` via service role.
 * Never throws or blocks the user flow if the service role key is absent or
 * the database insert fails.
 */
export function recordOnboardingEvent(data: {
  event: OnboardingEventName;
  userId?: string | null;
  pageId?: string | null;
  slug?: string | null;
  metadata?: Record<string, Json>;
}) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (!warned) {
      console.warn(
        "[onboarding-events] SUPABASE_SERVICE_ROLE_KEY is not set; onboarding events are not recorded.",
      );
      warned = true;
    }
    return;
  }

  const row = {
    event: data.event,
    user_id: data.userId ?? null,
    page_id: data.pageId ?? null,
    slug: data.slug ?? null,
    metadata: data.metadata ?? {},
  };

  const write = async () => {
    try {
      const { error } = await createAdminClient()
        .from("onboarding_events")
        .insert(row);
      if (error) {
        console.error("[onboarding-events] insert failed:", error.message);
      }
    } catch (err) {
      console.error("[onboarding-events] unexpected error:", err);
    }
  };

  try {
    after(write);
  } catch {
    void write();
  }
}
