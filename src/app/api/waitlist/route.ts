import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  plan: z.enum(["pro", "business"]),
  source: z.string().trim().max(60).optional().default("planos"),
});

/** POST /api/waitlist — registers interest in Pro or Business plans. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Confira seu e-mail." },
      { status: 400 },
    );
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub ?? null;
  } catch {
    // Public visitor
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("waitlist").insert({
      email: parsed.data.email,
      plan: parsed.data.plan,
      source: parsed.data.source,
      user_id: userId,
    });

    // Duplicate (same email + plan) is fine: treat as already subscribed!
    if (error && error.code !== "23505") {
      console.error("[api/waitlist] insert failed:", error.message);
      return NextResponse.json(
        { error: "Não conseguimos registrar seu e-mail agora." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/waitlist] unexpected error:", err);
    return NextResponse.json(
      { error: "Não conseguimos registrar seu e-mail agora." },
      { status: 500 },
    );
  }
}
