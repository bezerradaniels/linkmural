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
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#101828]">
          Faturamento
        </h1>
        <p className="mt-0.5 text-[15px] font-medium text-[#667085]">
          Assinaturas sincronizadas da Stripe e receita mensal recorrente (MRR)
          estimada.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAECF0] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <span className="text-[14px] font-medium text-[#667085]">
            Assinaturas ativas
          </span>
          <span className="text-[24px] font-bold tracking-tight text-[#101828] tabular-nums">
            {formatMetricNumber(activeRows.length)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAECF0] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <span className="text-[14px] font-medium text-[#667085]">
            MRR estimado
          </span>
          <span className="text-[24px] font-bold tracking-tight text-[#5B4FE9] tabular-nums">
            {formatBrl(mrrCents)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAECF0] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <span className="text-[14px] font-medium text-[#667085]">
            Cancelamento agendado
          </span>
          <span className="text-[24px] font-bold tracking-tight text-[#101828] tabular-nums">
            {formatMetricNumber(scheduledCancelCount)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAECF0] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <span className="text-[14px] font-medium text-[#667085]">
            Pagamento pendente
          </span>
          <span className="text-[24px] font-bold tracking-tight text-[#EF4444] tabular-nums">
            {formatMetricNumber(pastDueCount)}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2.5 rounded-[10px] border border-[#EAECF0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-[#101828]">
            Assinaturas
          </h2>
          <span className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-2 text-[12px] leading-none font-semibold text-[#5B4FE9]">
            {rows.length}
          </span>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon="payment"
            title="Nenhuma assinatura registrada"
            text="Quando os clientes assinarem um plano pago, as assinaturas sincronizadas pelo webhook da Stripe aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-[#EAECF0] bg-[#F9FAFB] text-[12px] font-semibold tracking-wider text-[#667085] uppercase">
                  <th className="py-2 pr-4 pl-3">Cliente</th>
                  <th className="py-2 pr-4">Plano</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Período até</th>
                  <th className="py-2 pr-3">Criada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
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
                    <tr key={sub.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-2.5 pr-4 pl-3">
                        <p className="font-semibold text-[#101828]">
                          {prof?.full_name || prof?.email || sub.user_id}
                        </p>
                        {prof?.email && prof?.full_name && (
                          <p className="text-[13px] text-[#667085]">
                            {prof.email}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-[#344054]">
                        {planLabel} · {intervalLabel}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <Badge variant="outline" dot={badge.dot}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-[#667085] tabular-nums">
                        {formatDate(sub.current_period_end)}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-[#667085] tabular-nums">
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
