"use client";

import { Button } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";

/** Opens the Stripe Customer Portal and tracks the intent in GA4. */
export function ManageSubscriptionButton({
  plan,
  variant = "outline",
}: {
  plan: "pro" | "business";
  variant?: "outline" | "primary";
}) {
  return (
    <form
      method="post"
      action="/api/stripe/portal"
      className="w-full"
      onSubmit={() => trackGaEvent("portal_assinatura_aberto", { plano: plan })}
    >
      <Button type="submit" variant={variant} size="md" className="w-full">
        Gerenciar assinatura
      </Button>
    </form>
  );
}
