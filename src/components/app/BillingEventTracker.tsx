"use client";

import { useEffect, useRef } from "react";
import { trackGaEvent } from "@/lib/gtm";
import type { BillingInterval } from "@/lib/plans";

type BillingEventProps =
  | {
      kind: "purchase";
      transactionId: string;
      value: number;
      plan: "pro" | "business";
      interval: BillingInterval;
    }
  | {
      kind: "checkout_canceled";
    };

/**
 * Fires GA4 billing events on the Plano screen when returning from Stripe
 * Checkout (?ok=1 or ?cancelado=1). Deduplicates `purchase` in sessionStorage
 * so reloading the page never double-counts revenue.
 */
export function BillingEventTracker(props: BillingEventProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (props.kind === "checkout_canceled") {
      trackGaEvent("checkout_cancelado", { origem: "painel_plano" });
      return;
    }

    const storageKey = `lm_ga_purchase_${props.transactionId}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage may be unavailable in restricted contexts; still fire once per mount.
    }

    trackGaEvent("purchase", {
      currency: "BRL",
      value: props.value,
      transaction_id: props.transactionId,
      plano: props.plan,
      periodicidade: props.interval,
    });
  }, [props]);

  return null;
}
