"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui";
import { PLANS, yearlySavingsPercent, type BillingInterval } from "@/lib/plans";

type Ctx = {
  interval: BillingInterval;
  setInterval: (i: BillingInterval) => void;
};

const BillingIntervalContext = createContext<Ctx>({
  interval: "year",
  setInterval: () => {},
});

/** Shares the chosen billing interval (yearly by default) between the toggle and the prices. */
export function BillingIntervalProvider({
  children,
  initial = "year",
}: {
  children: ReactNode;
  initial?: BillingInterval;
}) {
  const [interval, setInterval] = useState<BillingInterval>(initial);
  return (
    <BillingIntervalContext.Provider value={{ interval, setInterval }}>
      {children}
    </BillingIntervalContext.Provider>
  );
}

export function useBillingInterval(): BillingInterval {
  return useContext(BillingIntervalContext).interval;
}

/** Anual / Mensal switch. The yearly option carries the savings label. */
export function BillingToggle({ className }: { className?: string }) {
  const { interval, setInterval } = useContext(BillingIntervalContext);
  const savings = yearlySavingsPercent(PLANS.pro.price);

  return (
    <Segmented<BillingInterval>
      label="Periodicidade da cobrança"
      value={interval}
      onChange={setInterval}
      className={className}
      options={[
        {
          value: "year",
          label: savings > 0 ? `Anual · economize ${savings}%` : "Anual",
        },
        { value: "month", label: "Mensal" },
      ]}
    />
  );
}
