import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateCustomerId } from "@/lib/billing";
import { isSameOrigin, PRICE_LOOKUP_KEYS } from "@/lib/billing-core";
import { PLANS } from "@/lib/plans";
import { siteUrl } from "@/lib/redirect";
import { getStripe, isBillingEnabled, launchCouponId } from "@/lib/stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const formSchema = z.object({
  interval: z.enum(["month", "year"]).default("year"),
});

function back(code?: string) {
  const url = new URL("/app/plano", siteUrl());
  if (code) url.searchParams.set("erro", code);
  return NextResponse.redirect(url, 303);
}

/**
 * POST /api/stripe/checkout (form post from the Plano screen): opens a
 * Stripe-hosted Checkout for the Pro plan, monthly or yearly, with the launch
 * discount applied. Redirects to Stripe, or back to /app/plano with ?erro=.
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
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (!isBillingEnabled()) return back("indisponivel");

  const form = await request.formData().catch(() => null);
  const parsed = formSchema.safeParse({
    interval: form?.get("interval") ?? undefined,
  });
  if (!parsed.success) return back("checkout");
  const { interval } = parsed.data;

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, suspended_at")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.suspended_at) return back("suspensa");
    if (profile && profile.plan !== "free") return back("ja_assinante");

    const stripe = getStripe();
    const prices = await stripe.prices.list({
      lookup_keys: [PRICE_LOOKUP_KEYS[interval]],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      console.error("[checkout] price not found:", PRICE_LOOKUP_KEYS[interval]);
      return back("checkout");
    }

    const customerId = await getOrCreateCustomerId(userId, email);
    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: price.id, quantity: 1 }],
      // Stripe allows either a coupon or promotion codes in one session; the
      // launch discount is applied for the customer.
      discounts: PLANS.pro.promo ? [{ coupon: launchCouponId() }] : undefined,
      subscription_data: { metadata: { user_id: userId } },
      locale: "pt-BR",
      success_url: `${base}/app/plano?ok=1`,
      cancel_url: `${base}/app/plano?cancelado=1`,
    });

    if (!session.url) return back("checkout");
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("[checkout] failed:", err);
    return back("checkout");
  }
}
