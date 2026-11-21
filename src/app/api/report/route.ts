import { z } from "zod";
import { isBot } from "@/lib/analytics";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createAdminClient } from "@/utils/supabase/admin";

const bodySchema = z.object({
  pageId: z.uuid(),
  reason: z.enum(["golpe", "spam", "conteudo_improprio", "marca", "outro"]),
  details: z.string().trim().max(1000).optional(),
});

/** Report from the public page footer; only admins can read reports. */
export async function POST(request: Request) {
  if (isBot(request.headers.get("user-agent")))
    return new Response(null, { status: 403 });

  const rl = checkRateLimit(request, {
    bucket: "api:report",
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) {
    return rateLimitResponse(
      rl.retryAfterSeconds,
      "Muitas denúncias enviadas em pouco tempo. Tente novamente mais tarde.",
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[report] SUPABASE_SERVICE_ROLE_KEY is not set; report not stored.",
    );
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  const { pageId, reason, details } = parsed.data;
  const { error } = await createAdminClient()
    .from("reports")
    .insert({ page_id: pageId, reason, details: details || null });
  if (error) {
    // Unknown page (foreign key) or other failure: do not reveal which.
    console.error("[report] insert failed:", error.message);
    return Response.json({ error: "failed" }, { status: 400 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
