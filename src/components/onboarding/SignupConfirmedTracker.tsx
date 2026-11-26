"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackGaEvent } from "@/lib/gtm";

/** Fires the email signup conversion event once when ?confirmado=1 is present. */
export function SignupConfirmedTracker() {
  const searchParams = useSearchParams();
  const firedRef = useRef(false);
  const confirmed = searchParams.get("confirmado") === "1";
  const heroVariant = searchParams.get("hero_variant") ?? undefined;

  useEffect(() => {
    if (!confirmed || firedRef.current) return;
    firedRef.current = true;
    trackGaEvent("email_signup_confirmado", {
      origem: "lp_comecar",
      ...(heroVariant ? { hero_variant: heroVariant } : {}),
    });
  }, [confirmed, heroVariant]);

  return null;
}
