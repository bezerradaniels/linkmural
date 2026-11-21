import { Badge, EmptyState } from "@/components/ui";
import { PAID_STATUSES } from "@/lib/billing-core";
import { formatMetricNumber } from "@/lib/panel-helpers";
import { PLANS, formatBrl } from "@/lib/plans";
import { createAdminClient } from "@/utils/supabase/admin";

const STATUS_BADGE: Record<
  string,
  { label: string; dot: "positive" | "warning" | "negative" | "off" }
> = {
  active: { label: "Ativa", dot: "positive" },
  trialing: { label: "Em teste", dot: "positive" },
  past_due: { label: "Pagamento pendente", dot: "warning" },
  canceled: { label: "Cancelada", dot: "off" },
  unpaid: { label: "Não paga", dot: "negative" },
  incomplete: { label: "Incompleta", dot: "warning" },
  incomplete_expired: { label: "Expirada", dot: "off" },
  paused: { label: "Pausada", dot: "off" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export default async function AdminFaturamentoPage() {
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from("subscriptions")
    .select(
      "id, user_id, plan, billing_interval, status, current_period_end, cancel_at_period_end, created_at, profiles(email, full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = subs ?? [];
  const paidSet = new Set<string>(PAID_STATUSES);
  const activeRows = rows.filter((r) => paidSet.has(r.status));
  const pastDueCount = rows.filter((r) => r.status === "past_due").length;
  const scheduledCancelCount = activeRows.filter(
    (r) => r.cancel_at_period_end,
  ).length;

  const mrrCents = activeRows.reduce((sum, sub) => {
    const tier = sub.plan === "business" ? PLANS.business : PLANS.pro;
    const monthly =
      sub.billing_interval === "year"
        ? Math.round(tier.price.yearly / 12)
        : tier.price.monthly;
    return sum + monthly;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Faturamento
        </h1>
        <p className="text-small text-ink-muted">
          Assinaturas sincronizadas da Stripe e receita mensal recorrente (MRR)
          estimada no preço de lançamento.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">
            Assinaturas ativas
          </span>
          <span className="font-display text-display-md">
            {formatMetricNumber(activeRows.length)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">MRR estimado</span>
          <span className="font-display text-display-md">
            {formatBrl(mrrCents)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">
            Cancelamento agendado
          </span>
          <span className="font-display text-display-md">
            {formatMetricNumber(scheduledCancelCount)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">
            Pagamento pendente
          </span>
          <span className="font-display text-display-md">
            {formatMetricNumber(pastDueCount)}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Assinaturas ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <EmptyState
            icon="payment"
            title="Nenhuma assinatura registrada"
            text="Quando os clientes assinarem o plano Pro, as assinaturas sincronizadas pelo webhook da Stripe aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small">
              <thead>
                <tr className="border-b border-line text-caption text-ink-muted">
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Plano</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Período até</th>
                  <th className="py-2 font-medium">Criada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((sub) => {
                  const prof = Array.isArray(sub.profiles)
                    ? sub.profiles[0]
                    : sub.profiles;
                  const badge = sub.cancel_at_period_end
                    ? { label: "Cancel. agendado", dot: "warning" as const }
                    : (STATUS_BADGE[sub.status] ?? {
                        label: sub.status,
                        dot: "off" as const,
                      });
                  const planLabel =
                    sub.plan === "business" ? "Negócios" : "Pro";
                  const intervalLabel =
                    sub.billing_interval === "year"
                      ? "Anual"
                      : sub.billing_interval === "month"
                        ? "Mensal"
                        : "—";

                  return (
                    <tr key={sub.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-ink">
                          {prof?.full_name || prof?.email || sub.user_id}
                        </p>
                        {prof?.email && prof?.full_name && (
                          <p className="text-caption text-ink-muted">
                            {prof.email}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {planLabel} · {intervalLabel}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Badge variant="outline" dot={badge.dot}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-ink-muted">
                        {formatDate(sub.current_period_end)}
                      </td>
                      <td className="py-3 whitespace-nowrap text-ink-muted">
                        {formatDate(sub.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
