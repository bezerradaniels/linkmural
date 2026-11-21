"use client";

import { useBillingInterval } from "@/components/marketing/BillingInterval";
import { formatBrl, monthlyEquivalent, PLANS, type Plan } from "@/lib/plans";

/**
 * Price of a plan for the interval chosen in the BillingToggle (yearly by
 * default). Yearly shows the monthly equivalent, with a note that the amount
 * is charged once a year. Shows the launch discount when there is one.
 */
export function PlanPrice({ plan }: { plan: Plan }) {
  const interval = useBillingInterval();
  const { price, listPrice, promo } = PLANS[plan];

  if (price.monthly === 0) {
    return (
      <div>
        <span className="font-display text-display-md">{formatBrl(0)}</span>
      </div>
    );
  }

  const yearly = interval === "year";
  const shown = yearly ? monthlyEquivalent(price.yearly) : price.monthly;
  const listShown = listPrice
    ? yearly
      ? monthlyEquivalent(listPrice.yearly)
      : listPrice.monthly
    : null;

  return (
    <div>
      {listShown !== null && promo ? (
        <p className="text-caption text-ink-muted">
          de{" "}
          <s aria-label={`preço normal ${formatBrl(listShown)} por mês`}>
            {formatBrl(listShown)}
          </s>{" "}
          por
        </p>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-x-1">
        <span className="font-display text-display-md">{formatBrl(shown)}</span>
        <span className="text-small text-ink-muted">/mês</span>
      </div>

      {yearly ? (
        <p className="mt-1 text-caption text-ink">
          Pagamento único de <strong>{formatBrl(price.yearly)}</strong> por ano,
          não é cobrado todo mês.
        </p>
      ) : (
        <p className="mt-1 text-caption text-ink">
          Cobrado todo mês, <strong>{formatBrl(price.monthly)}</strong> por mês.
        </p>
      )}

      {listPrice && promo ? (
        <p className="mt-2 text-caption text-ink-muted">
          Desconto de lançamento de {promo.percentOff}% nos primeiros{" "}
          {promo.months} meses. Depois,{" "}
          {yearly
            ? `${formatBrl(listPrice.yearly)} por ano (pagamento único, renovado todo ano)`
            : `${formatBrl(listPrice.monthly)} por mês`}
          .
        </p>
      ) : null}
    </div>
  );
}
