import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/billing-core";
import { siteUrl } from "@/lib/redirect";
import { getStripe, isBillingEnabled } from "@/lib/stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

function back(code?: string) {
  const url = new URL("/app/plano", siteUrl());
  if (code) url.searchParams.set("erro", code);
  return NextResponse.redirect(url, 303);
}

/**
 * POST /api/stripe/portal (form post from the Plano screen): opens the Stripe
 * Customer Portal (card, invoices, cancel at period end) and returns to /app/plano.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) {
    return new Response(null, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.redirect(
      new URL("/entrar?next=%2Fapp%2Fplano", siteUrl()),
      303,
    );
  }
  if (!isBillingEnabled()) return back("indisponivel");

  try {
    const { data: profile } = await createAdminClient()
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.stripe_customer_id) return back("sem_assinatura");

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/app/plano`,
      locale: "pt-BR",
    });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("[portal] failed:", err);
    return back("portal");
  }
}
