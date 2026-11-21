"use client";

import { useBillingInterval } from "@/components/marketing/BillingInterval";
import { Button } from "@/components/ui";

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
  return (
    <form method="post" action="/api/stripe/checkout" className="w-full">
      <input type="hidden" name="interval" value={interval} />
      <Button type="submit" variant="primary" size="md" className="w-full">
        {label}
      </Button>
    </form>
  );
}
