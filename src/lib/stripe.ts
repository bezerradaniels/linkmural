import "server-only";
import Stripe from "stripe";

/**
 * Billing is on only where STRIPE_SECRET_KEY is set. Until the keys are in an
 * environment (Hostinger variables, .env.local), the panel keeps the waiting
 * list and no billing route does anything.
 */
export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  client ??= new Stripe(key, {
    maxNetworkRetries: 2,
    appInfo: { name: "linkmural" },
  });
  return client;
}

/** Coupon applied to every new Pro checkout while the launch discount runs (docs/HANDOFF.md §12). */
export function launchCouponId(): string {
  return process.env.STRIPE_LAUNCH_COUPON_ID || "lancamento_50_12m";
}
