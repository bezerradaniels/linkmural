import "server-only";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  customerIdOf,
  linksToDeactivate,
  subscriptionRow,
  type StripeSubscriptionLike,
} from "./billing-core";
import { linkTag, pageTag } from "./public-page";
import { getStripe, isBillingEnabled } from "./stripe";

/** Stripe customer of this user, created on first checkout and saved on the profile. */
export async function getOrCreateCustomerId(
  userId: string,
  email: string | null,
): Promise<string> {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  // The idempotency key makes two simultaneous first checkouts share one customer.
  const customer = await getStripe().customers.create(
    { email: email ?? undefined, metadata: { user_id: userId } },
    { idempotencyKey: `linkmural-customer-${userId}` },
  );
  const { error: saveError } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  if (saveError) throw saveError;
  return customer.id;
}

/**
 * Who owns this subscription: our own metadata first, then the customer saved
 * on the profile. Returns null when the profile no longer exists (an account
 * that was just deleted), so late webhook events for it are ignored.
 */
async function userIdOf(sub: StripeSubscriptionLike): Promise<string | null> {
  const admin = createAdminClient();
  const fromMetadata = sub.metadata?.user_id;
  const query = admin.from("profiles").select("id");
  const { data } = fromMetadata
    ? await query.eq("id", fromMetadata).maybeSingle()
    : await query.eq("stripe_customer_id", customerIdOf(sub)).maybeSingle();
  return data?.id ?? null;
}

/**
 * Brings our copy of a subscription up to date with Stripe, then applies the
 * downgrade when the account ended up on the free plan. It always reads the
 * subscription from Stripe, so duplicated or out-of-order events are harmless:
 * the result depends only on Stripe's current state (idempotent).
 */
export async function syncSubscription(
  subscriptionId: string,
  fallback?: Stripe.Subscription,
): Promise<void> {
  let sub: Stripe.Subscription;
  try {
    sub = await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (err) {
    if (fallback && (err as { code?: string }).code === "resource_missing") {
      sub = fallback;
    } else {
      throw err;
    }
  }

  const userId = await userIdOf(sub);
  if (!userId) {
    // Not an error: deleting an account deletes the customer, and Stripe then
    // reports the cancelled subscription for a user that is already gone.
    console.warn("[billing] subscription without an existing user:", sub.id);
    return;
  }
  const row = subscriptionRow(sub, userId);
  if (!row) {
    console.error(
      "[billing] subscription with an unknown price or status:",
      sub.id,
    );
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "id" });
  if (error) throw error;

  // The database trigger has just recalculated profiles.plan.
  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.plan === "free") await applyDowngrade(userId);
}

/**
 * Free-plan rules after a downgrade: links above the limit are deactivated
 * (never deleted) and the "Feito com linkmural" mark comes back. Pages beyond
 * the first and custom domains do not exist for Pro, so there is nothing to
 * unpublish yet (Business, Phase 6).
 */
export async function applyDowngrade(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: pages } = await admin
    .from("pages")
    .select("id, slug, links(id, active, featured, position)")
    .eq("owner_id", userId);

  for (const page of pages ?? []) {
    const off = linksToDeactivate(page.links ?? []);
    if (off.length > 0) {
      await admin.from("links").update({ active: false }).in("id", off);
      for (const id of off) revalidateTag(linkTag(id), "max");
    }
    await admin.from("pages").update({ show_branding: true }).eq("id", page.id);
    revalidateTag(pageTag(page.slug), "max");
  }
}

function subscriptionIdOf(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** Handles one verified Stripe webhook event. Unknown events are ignored. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") return;
      const id = subscriptionIdOf(session.subscription);
      if (id) await syncSubscription(id);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await syncSubscription(sub.id, sub);
      return;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const id = subscriptionIdOf(
        invoice.parent?.subscription_details?.subscription,
      );
      if (id) await syncSubscription(id);
      return;
    }
    default:
      return;
  }
}

/**
 * Deletes the Stripe customer, which cancels its subscriptions right away.
 * Used before an account is deleted so nobody keeps being charged. When it
 * fails the deletion must stop.
 */
export async function deleteStripeCustomerForUser(
  userId: string,
): Promise<{ ok: true } | { ok: false }> {
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  const customerId = profile?.stripe_customer_id;
  if (!customerId) return { ok: true };
  if (!isBillingEnabled()) {
    console.error(
      "[billing] customer exists but Stripe is not configured:",
      userId,
    );
    return { ok: false };
  }
  try {
    await getStripe().customers.del(customerId);
    return { ok: true };
  } catch (err) {
    if ((err as { code?: string }).code === "resource_missing") {
      return { ok: true };
    }
    console.error("[billing] could not delete the Stripe customer:", err);
    return { ok: false };
  }
}
