import { NextResponse } from "next/server";
import { z } from "zod";
import { recordOnboardingEvent } from "@/lib/onboarding-events";
import { createClient } from "@/utils/supabase/server";

const bodySchema = z.object({
  event: z.enum(["link_copiado", "qr_baixado"]),
  pageId: z.string().uuid(),
  format: z.enum(["png", "svg"]).optional(),
});

/** Records client-side actions from /onboarding/pronto (link_copiado, qr_baixado). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Requisição inválida." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("id", parsed.data.pageId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!page) {
    return NextResponse.json(
      { error: "Página não encontrada." },
      { status: 404 },
    );
  }

  recordOnboardingEvent({
    event: parsed.data.event,
    userId,
    pageId: page.id,
    slug: page.slug,
    metadata: parsed.data.format ? { format: parsed.data.format } : {},
  });

  return NextResponse.json({ ok: true });
}
