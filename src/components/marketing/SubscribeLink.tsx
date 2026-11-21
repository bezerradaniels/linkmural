"use client";

import Link from "next/link";
import { useBillingInterval } from "@/components/marketing/BillingInterval";
import { buttonClasses } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";

/**
 * "Assinar o Pro" on the public price page. A visitor has to sign in (and own
 * a page) before paying, so this goes to the login and then to the Plano
 * screen with the interval chosen in the toggle already selected.
 */
export function SubscribeLink({ label = "Assinar o Pro" }: { label?: string }) {
  const interval = useBillingInterval();
  const next = `/app/plano?periodo=${interval}`;
  return (
    <Link
      href={`/entrar?next=${encodeURIComponent(next)}`}
      onClick={() =>
        trackGaEvent("clique_assinar_pro", {
          plano: "pro",
          periodicidade: interval,
          origem: "planos",
        })
      }
      className={buttonClasses({
        variant: "secondary",
        size: "md",
        className: "w-full",
      })}
    >
      {label}
    </Link>
  );
}
