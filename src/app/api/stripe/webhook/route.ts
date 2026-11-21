import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/billing";
import { getStripe, isBillingEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook. The signature is checked against the raw body, then the
 * event updates `subscriptions` (and, through the database trigger,
 * `profiles.plan`). Handling is idempotent: see syncSubscription.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isBillingEnabled() || !secret) {
    return new Response(null, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response(null, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    // 500 makes Stripe retry later.
    console.error("[stripe webhook] failed:", event.type, event.id, err);
    return new Response(null, { status: 500 });
  }
  return Response.json({ received: true });
}
