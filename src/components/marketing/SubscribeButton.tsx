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
  plan = "pro",
  label,
}: {
  plan?: "pro" | "business";
  label?: string;
}) {
  const interval = useBillingInterval();
  const planConfig = PLANS[plan];
  const valueCents =
    interval === "year" ? planConfig.price.yearly : planConfig.price.monthly;
  const buttonLabel = label ?? `Assinar o ${planConfig.label}`;

  return (
    <form
      method="post"
      action="/api/stripe/checkout"
      className="w-full"
      onSubmit={() =>
        trackGaEvent("begin_checkout", {
          currency: "BRL",
          value: valueCents / 100,
          plano: plan,
          periodicidade: interval,
        })
      }
    >
      <input type="hidden" name="interval" value={interval} />
      <input type="hidden" name="plan" value={plan} />
      <Button type="submit" variant="primary" size="md" className="w-full">
        {buttonLabel}
      </Button>
    </form>
  );
}
