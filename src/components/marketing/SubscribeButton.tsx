"use client";

import { useBillingInterval } from "@/components/marketing/BillingInterval";
import { Button } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";
import { PLANS } from "@/lib/plans";

/**
 * "Assinar Pro" for the interval chosen in the BillingToggle. A plain form
 * post (no JavaScript needed to submit): the route redirects to Stripe Checkout.
 */
export function SubscribeButton({
  label = "Assinar o Pro",
}: {
  label?: string;
}) {
  const interval = useBillingInterval();
  const valueCents =
    interval === "year" ? PLANS.pro.price.yearly : PLANS.pro.price.monthly;

  return (
    <form
      method="post"
      action="/api/stripe/checkout"
      className="w-full"
      onSubmit={() =>
        trackGaEvent("begin_checkout", {
          currency: "BRL",
          value: valueCents / 100,
          plano: "pro",
          periodicidade: interval,
        })
      }
    >
      <input type="hidden" name="interval" value={interval} />
      <Button type="submit" variant="primary" size="md" className="w-full">
        {label}
      </Button>
    </form>
  );
}
