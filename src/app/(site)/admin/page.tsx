import Link from "next/link";
import { Badge, Progress } from "@/components/ui";
import { PAID_STATUSES } from "@/lib/billing-core";
import { formatMetricNumber } from "@/lib/panel-helpers";
import { PLANS, formatBrl } from "@/lib/plans";
import { createAdminClient } from "@/utils/supabase/admin";

const FUNNEL_STEPS = [
  { key: "slug_escolhido", label: "Endereço escolhido" },
  { key: "conta_criada", label: "Conta criada" },
  { key: "estilo_escolhido", label: "Estilo escolhido" },
  { key: "dados_salvos", label: "Dados salvos" },
  { key: "links_adicionados", label: "Links adicionados" },
  { key: "modelo_escolhido", label: "Modelo escolhido" },
  { key: "pagina_publicada", label: "Página publicada" },
] as const;

function getWindowDates() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(3, 0, 0, 0); // 00:00 America/Sao_Paulo
  if (todayStart > now) todayStart.setDate(todayStart.getDate() - 1);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  return {
    todayIso: todayStart.toISOString(),
    sevenDaysIso: sevenDaysAgo.toISOString(),
  };
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const { todayIso, sevenDaysIso } = getWindowDates();

  const [
    profilesCountRes,
    publishedCountRes,
    openReportsRes,
    clicks7dRes,
    recentProfilesRes,
    recentPagesRes,
    eventsRes,
    activeSubsRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .is("blocked_at", null),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("click_events")
      .select("event, occurred_at")
      .gte("occurred_at", sevenDaysIso),
    admin
      .from("profiles")
      .select("id, full_name, email, plan, created_at, suspended_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("pages")
      .select("owner_id, slug, business_name, published, blocked_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("onboarding_events").select("event").limit(5000),
    admin
      .from("subscriptions")
      .select("plan, billing_interval, status")
      .in("status", [...PAID_STATUSES]),
  ]);

  const activeSubs = activeSubsRes.data ?? [];
  const mrrCents = activeSubs.reduce((sum, sub) => {
    const tier = sub.plan === "business" ? PLANS.business : PLANS.pro;
    const monthly =
      sub.billing_interval === "year"
        ? Math.round(tier.price.yearly / 12)
        : tier.price.monthly;
    return sum + monthly;
  }, 0);

  const clicks7d = clicks7dRes.data ?? [];
  let viewsToday = 0;
  let clicksToday = 0;
  let views7 = 0;
  let clicks7 = 0;
  for (const row of clicks7d) {
    const isView = row.event === "view";
    if (isView) views7++;
    else clicks7++;
    if (row.occurred_at >= todayIso) {
      if (isView) viewsToday++;
      else clicksToday++;
    }
  }

  // Onboarding funnel counts
  const funnelCounts: Record<string, number> = {};
  for (const e of eventsRes.data ?? []) {
    funnelCounts[e.event] = (funnelCounts[e.event] ?? 0) + 1;
  }
  const topFunnel = Math.max(1, funnelCounts.slug_escolhido ?? 0);

  // Map owner -> primary page for latest signups
  const pageByOwner = new Map<
    string,
    { slug: string; business_name: string; published: boolean }
  >();
  for (const p of recentPagesRes.data ?? []) {
    if (!pageByOwner.has(p.owner_id)) {
      pageByOwner.set(p.owner_id, p);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Dashboard
        </h1>
        <p className="text-small text-ink-muted">
          Visão geral de contas, tráfego e funil de onboarding.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">Contas</span>
          <span className="font-display text-display-md">
            {formatMetricNumber(profilesCountRes.count ?? 0)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">
            Páginas publicadas
          </span>
          <span className="font-display text-display-md">
            {formatMetricNumber(publishedCountRes.count ?? 0)}
          </span>
        </div>

        <Link
          href="/admin/faturamento"
          className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 hover:border-ink"
        >
          <span className="text-caption text-ink-muted">
            Assinaturas · MRR est.
          </span>
          <span className="font-display text-title">
            {formatMetricNumber(activeSubs.length)} · {formatBrl(mrrCents)}
          </span>
          <span className="text-caption text-ink-muted">
            Ver faturamento →
          </span>
        </Link>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption text-ink-muted">
            Hoje (visitas / cliques)
          </span>
          <span className="font-display text-title">
            {formatMetricNumber(viewsToday)} / {formatMetricNumber(clicksToday)}
          </span>
          <span className="text-caption text-ink-muted">
            7d: {formatMetricNumber(views7)} / {formatMetricNumber(clicks7)}
          </span>
        </div>

        <Link
          href="/admin/moderacao"
          className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 hover:border-ink"
        >
          <span className="text-caption text-ink-muted">Denúncias abertas</span>
          <span className="font-display text-display-md">
            {formatMetricNumber(openReportsRes.count ?? 0)}
          </span>
        </Link>
      </section>

      {/* Onboarding funnel */}
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <div>
          <h2 className="font-display text-title tracking-[-0.02em]">
            Funil de onboarding
          </h2>
          <p className="text-small text-ink-muted">
            Eventos registrados em <code>onboarding_events</code>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FUNNEL_STEPS.map((step, i) => {
            const count = funnelCounts[step.key] ?? 0;
            const prevCount =
              i === 0 ? count : (funnelCounts[FUNNEL_STEPS[i - 1].key] ?? 0);
            const pctFromStart = Math.round((count / topFunnel) * 100);
            const stepRate =
              i === 0 || prevCount === 0
                ? null
                : Math.round((count / prevCount) * 100);

            return (
              <div key={step.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-small">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-ink-muted">
                    <strong className="text-ink">
                      {formatMetricNumber(count)}
                    </strong>
                    {stepRate !== null && ` (${stepRate}% do passo anterior)`}
                  </span>
                </div>
                <Progress value={pctFromStart} max={100} label={step.label} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Latest signups */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-title tracking-[-0.02em]">
            Últimos cadastros
          </h2>
          <Link
            href="/admin/empresas"
            className="text-small font-semibold underline underline-offset-2"
          >
            Ver todas →
          </Link>
        </div>

        <div className="divide-y divide-line">
          {(recentProfilesRes.data ?? []).map((p) => {
            const page = pageByOwner.get(p.id);
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-small"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {page?.business_name || p.full_name || p.email || p.id}
                  </p>
                  <p className="truncate text-caption text-ink-muted">
                    {p.email} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {p.suspended_at && (
                    <Badge variant="neutral" dot="negative">
                      Suspensa
                    </Badge>
                  )}
                  {page ? (
                    <Link
                      href={`/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption font-semibold text-ink underline underline-offset-2"
                    >
                      /{page.slug}
                    </Link>
                  ) : (
                    <Badge variant="neutral">Sem página</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
