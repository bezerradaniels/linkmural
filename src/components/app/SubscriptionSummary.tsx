import type { ReactNode } from "react";
import { Badge, Icon } from "@/components/ui";
import type { SubscriptionSummary as Summary } from "@/lib/billing-core";
import { formatBrl } from "@/lib/plans";

const STATUS: Record<
  string,
  { label: string; dot: "positive" | "warning" | "negative" | "off" }
> = {
  active: { label: "Ativa", dot: "positive" },
  trialing: { label: "Em teste", dot: "positive" },
  past_due: { label: "Pagamento pendente", dot: "warning" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-line py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="text-small font-semibold sm:text-right">{children}</dd>
    </div>
  );
}

/**
 * What a paying customer sees on the Plano screen instead of the price
 * comparison: the plan, what it costs now, when the launch discount ends and
 * the next charge. The actions (manage, cancel) go in `actions`.
 */
export function SubscriptionSummary({
  planLabel,
  status,
  cancelAtPeriodEnd,
  endsOn,
  summary,
  discountPercent,
  features,
  actions,
}: {
  planLabel: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  /** When a plan set to cancel stops, for the status and the next-charge line. */
  endsOn: Date | null;
  /** null when we have no subscription row (plan set by hand or not synced yet). */
  summary: Summary | null;
  discountPercent: number | null;
  features: string[];
  actions: ReactNode;
}) {
  const badge = cancelAtPeriodEnd
    ? { label: "Cancelamento agendado", dot: "warning" as const }
    : (STATUS[status] ?? { label: status, dot: "off" as const });
  const per = summary?.interval === "year" ? "por ano" : "por mês";

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-ink bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-title">Sua assinatura</h2>
        <Badge variant="outline" dot={badge.dot}>
          {badge.label}
        </Badge>
      </div>

      <dl className="flex flex-col">
        <Row label="Plano">
          {planLabel}
          {summary && ` · ${summary.interval === "year" ? "Anual" : "Mensal"}`}
        </Row>

        {summary && (
          <Row label="Valor">
            {formatBrl(summary.currentPrice)} {per}
            {summary.promoActive && summary.promoEndsAt && (
              <span className="block text-caption font-normal text-ink-muted">
                {discountPercent
                  ? `Desconto de lançamento de ${discountPercent}% até `
                  : "Preço de lançamento até "}
                {formatDate(summary.promoEndsAt)}
              </span>
            )}
          </Row>
        )}

        {summary?.next ? (
          <Row label="Próxima cobrança">
            {formatDate(summary.next.at)} · {formatBrl(summary.next.price)}
            {summary.promoActive &&
              summary.next.price > summary.currentPrice && (
                <span className="block text-caption font-normal text-ink-muted">
                  Preço regular: o desconto de lançamento termina antes.
                </span>
              )}
          </Row>
        ) : (
          cancelAtPeriodEnd &&
          endsOn && (
            <Row label="Fim do plano">
              {formatDate(endsOn)}
              <span className="block text-caption font-normal text-ink-muted">
                Sem novas cobranças. Até lá, tudo continua funcionando.
              </span>
            </Row>
          )
        )}
      </dl>

      <ul className="flex flex-col gap-2 border-t border-line pt-4 text-small text-ink-muted">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <Icon
              name="check"
              size={16}
              className="mt-0.5 shrink-0 text-positive"
            />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:max-w-xs">{actions}</div>
    </section>
  );
}
