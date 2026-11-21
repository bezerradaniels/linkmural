import type { TablesInsert } from "@/utils/supabase/types";
import { PLANS, type BillingInterval, type Plan } from "./plans";

/**
 * Pure billing rules (no Stripe client, no database): mapping a Stripe
 * subscription to our `subscriptions` row, the downgrade rule for links and
 * the same-origin check for the form-posted routes. Tested in billing-core.test.ts.
 */

/** Price `lookup_key` per billing interval (docs/HANDOFF.md §12). */
export const PRICE_LOOKUP_KEYS: Record<BillingInterval, string> = {
  month: "pro_monthly",
  year: "pro_yearly",
};

/** Subscription statuses that keep the paid plan on (mirrors sync_profile_plan in the database). */
export const PAID_STATUSES = ["active", "trialing", "past_due"] as const;

const KNOWN_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
] as const;

type SubStatus = (typeof KNOWN_STATUSES)[number];

/** The part of a Stripe Subscription we read. */
export type StripeSubscriptionLike = {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end: boolean;
  /**
   * Date the subscription is set to end. With the current Stripe API the
   * Customer Portal cancels "at the end of the period" by setting this date
   * and leaves cancel_at_period_end false.
   */
  cancel_at?: number | null;
  metadata?: Record<string, string> | null;
  items: {
    data: {
      current_period_end?: number | null;
      price: {
        id: string;
        lookup_key?: string | null;
        metadata?: Record<string, string> | null;
        recurring?: { interval?: string | null } | null;
      };
    }[];
  };
};

/** Which plan a Stripe price sells, from its metadata or lookup key. */
export function planFromPrice(price: {
  lookup_key?: string | null;
  metadata?: Record<string, string> | null;
}): Plan | null {
  const fromMetadata = price.metadata?.plan;
  if (fromMetadata === "pro" || fromMetadata === "business") {
    return fromMetadata;
  }
  const key = price.lookup_key ?? "";
  if (key.startsWith("pro_")) return "pro";
  if (key.startsWith("business_")) return "business";
  return null;
}

export function customerIdOf(sub: Pick<StripeSubscriptionLike, "customer">) {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

/**
 * Row for `subscriptions` built from a Stripe subscription, or null when it
 * has no price we sell or a status we don't know.
 */
export function subscriptionRow(
  sub: StripeSubscriptionLike,
  userId: string,
): TablesInsert<"subscriptions"> | null {
  const item = sub.items.data.find((i) => planFromPrice(i.price) !== null);
  if (!item) return null;
  const plan = planFromPrice(item.price);
  if (!plan) return null;
  if (!KNOWN_STATUSES.includes(sub.status as SubStatus)) return null;

  const interval = item.price.recurring?.interval;
  return {
    id: sub.id,
    user_id: userId,
    stripe_customer_id: customerIdOf(sub),
    price_id: item.price.id,
    plan,
    billing_interval:
      interval === "month" || interval === "year" ? interval : null,
    status: sub.status as SubStatus,
    current_period_end: item.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    // Scheduled to end by either flag (see cancel_at above).
    cancel_at_period_end:
      sub.cancel_at_period_end || (sub.cancel_at ?? null) !== null,
  };
}

/**
 * Downgrade rule (docs/HANDOFF.md §12): above the free limit, links are
 * deactivated, never deleted. The featured link and the first ones in order stay.
 */
export function linksToDeactivate(
  links: { id: string; active: boolean; featured: boolean; position: number }[],
  limit: number = PLANS.free.maxLinks ?? 5,
): string[] {
  const active = links
    .filter((l) => l.active)
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) || a.position - b.position,
    );
  return active.slice(limit).map((l) => l.id);
}

export type SubscriptionSummary = {
  interval: BillingInterval;
  /** What each charge is now, in cents: the launch price while the discount runs, else the regular one. */
  currentPrice: number;
  /** Is the launch discount still running? */
  promoActive: boolean;
  /** When the launch discount ends (12 months after the subscription started), if there is one. */
  promoEndsAt: Date | null;
  /** The next charge (date and amount in cents), or null when the plan will not renew. */
  next: { at: Date; price: number } | null;
};

/** A charge this close to the end of the discount window is treated as the first one after it. */
const PROMO_EDGE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * What the Plano screen tells a subscriber: the price now, when the launch
 * discount ends and what the next charge will be. The discount is a coupon of
 * `promo.months` months counted from the start of the subscription, so a
 * monthly plan is discounted 12 times and a yearly plan only once. The dates
 * come from our own copy of the subscription (created_at, current_period_end).
 */
export function summarizeSubscription(
  input: {
    interval: BillingInterval | null;
    createdAt: Date;
    periodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    now: Date;
  },
  pro = PLANS.pro,
): SubscriptionSummary {
  const interval: BillingInterval = input.interval ?? "month";
  const launch = pro.price[interval === "year" ? "yearly" : "monthly"];
  const regular = (pro.listPrice ?? pro.price)[
    interval === "year" ? "yearly" : "monthly"
  ];

  let promoEndsAt: Date | null = null;
  if (pro.promo) {
    promoEndsAt = new Date(input.createdAt);
    promoEndsAt.setUTCMonth(promoEndsAt.getUTCMonth() + pro.promo.months);
  }
  const promoActive = promoEndsAt !== null && input.now < promoEndsAt;

  let next: SubscriptionSummary["next"] = null;
  if (input.periodEnd && !input.cancelAtPeriodEnd) {
    const discounted =
      promoEndsAt !== null &&
      input.periodEnd.getTime() < promoEndsAt.getTime() - PROMO_EDGE_MS;
    next = { at: input.periodEnd, price: discounted ? launch : regular };
  }

  return {
    interval,
    currentPrice: promoActive ? launch : regular,
    promoActive,
    promoEndsAt,
    next,
  };
}

/**
 * CSRF guard for the form-posted routes: when the browser sends an Origin,
 * its host must be the host the request was made to.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}
