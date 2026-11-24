import Link from "next/link";
import {
  AdminDonutCard,
  type DonutSlide,
} from "@/components/admin/AdminDonutCard";
import { AdminPlanStackCard } from "@/components/admin/AdminPlanStackCard";
import {
  AdminTrafficChart,
  type DailyTrafficPoint,
} from "@/components/admin/AdminTrafficChart";
import { Avatar, Badge, Progress } from "@/components/ui";
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

const SAO_PAULO_TZ = "America/Sao_Paulo";

function spDateKey(date: Date): string {
  // Returns YYYY-MM-DD in America/Sao_Paulo
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function spShortLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(/\./g, "")
    .replace(/\s+de\s+/g, " ");
}

function formatSignupTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(/\./g, "")
    .replace(/\s+de\s+/g, " ");
}

function pctOf(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function KpiArrowButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-grid size-9 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink-muted transition-colors hover:border-ink hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        width={15}
        height={15}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </Link>
  );
}

const PRESET_LABELS: Record<string, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  last_7d: "Últimos 7 dias",
  last_14d: "Últimos 14 dias",
  last_30d: "Últimos 30 dias",
  this_month: "Este mês",
  last_month: "Mês passado",
  last_90d: "Últimos 90 dias",
  custom: "Período personalizado",
};

function parseIsoDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

function spMidnightIso(isoDay: string, endOfDay = false): string {
  // America/Sao_Paulo is UTC-3 (no DST since 2019).
  return endOfDay
    ? `${isoDay}T23:59:59.999-03:00`
    : `${isoDay}T00:00:00.000-03:00`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  const { from: rawFrom, to: rawTo, preset: rawPreset } = await searchParams;
  const admin = createAdminClient();
  const now = new Date();
  const todayKey = spDateKey(now);

  const defaultFromDate = new Date(now.getTime() - 13 * 86_400_000);
  const parsedFrom = parseIsoDay(rawFrom);
  const parsedTo = parseIsoDay(rawTo);

  let fromKey = parsedFrom ? rawFrom! : spDateKey(defaultFromDate);
  let toKey = parsedTo ? rawTo! : todayKey;
  if (fromKey > toKey) {
    const tmp = fromKey;
    fromKey = toKey;
    toKey = tmp;
  }
  if (toKey > todayKey) toKey = todayKey;

  const rangeStartIso = spMidnightIso(fromKey, false);
  const rangeEndIso = spMidnightIso(toKey, true);
  const rangeLabel =
    (rawPreset && PRESET_LABELS[rawPreset]) ||
    (rawFrom || rawTo ? "Período personalizado" : "Últimos 14 dias");

  const [
    profilesAllRes,
    recentProfilesRes,
    pagesAllRes,
    openReportsRes,
    waitlistCountRes,
    clicksRangeRes,
    eventsRes,
    activeSubsRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("plan, created_at, suspended_at")
      .limit(10000),
    admin
      .from("profiles")
      .select("id, full_name, email, plan, created_at, suspended_at")
      .order("created_at", { ascending: false })
      .limit(7),
    admin
      .from("pages")
      .select("owner_id, slug, business_name, published, blocked_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin.from("waitlist").select("id", { count: "exact", head: true }),
    admin
      .from("click_events")
      .select("event, occurred_at, device")
      .gte("occurred_at", rangeStartIso)
      .lte("occurred_at", rangeEndIso)
      .limit(30000),
    admin.from("onboarding_events").select("event").limit(5000),
    admin
      .from("subscriptions")
      .select("plan, billing_interval, status")
      .in("status", [...PAID_STATUSES]),
  ]);

  // 1. Profiles & plans breakdown
  const allProfiles = profilesAllRes.data ?? [];
  const totalProfiles = allProfiles.length;
  let newProfilesInRange = 0;
  let freeCount = 0;
  let proCount = 0;
  let businessCount = 0;
  let suspendedCount = 0;

  for (const p of allProfiles) {
    const createdDay = spDateKey(new Date(p.created_at));
    if (createdDay >= fromKey && createdDay <= toKey) newProfilesInRange++;
    if (p.suspended_at) suspendedCount++;
    if (p.plan === "business") businessCount++;
    else if (p.plan === "pro") proCount++;
    else freeCount++;
  }

  // 2. Pages breakdown + owner -> primary page map
  const allPages = pagesAllRes.data ?? [];
  let publishedPages = 0;
  let draftPages = 0;
  let blockedPages = 0;
  const pageByOwner = new Map<
    string,
    { slug: string; business_name: string; published: boolean }
  >();

  for (const p of allPages) {
    if (p.blocked_at) blockedPages++;
    else if (p.published) publishedPages++;
    else draftPages++;

    if (!pageByOwner.has(p.owner_id)) {
      pageByOwner.set(p.owner_id, p);
    }
  }
  const accountsWithoutPage = Math.max(0, totalProfiles - pageByOwner.size);

  // 3. Subscriptions & MRR
  const activeSubs = activeSubsRes.data ?? [];
  const mrrCents = activeSubs.reduce((sum, sub) => {
    const tier = sub.plan === "business" ? PLANS.business : PLANS.pro;
    const monthly =
      sub.billing_interval === "year"
        ? Math.round(tier.price.yearly / 12)
        : tier.price.monthly;
    return sum + monthly;
  }, 0);

  // 4. Selected-range daily traffic series + devices
  const dailyMap = new Map<string, DailyTrafficPoint>();
  const startCursor = parseIsoDay(fromKey) ?? defaultFromDate;
  const endCursor = parseIsoDay(toKey) ?? now;
  const maxDays = 180;
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(startCursor.getTime() + i * 86_400_000);
    if (d.getTime() > endCursor.getTime() + 1000) break;
    const key = spDateKey(d);
    if (!dailyMap.has(key)) {
      dailyMap.set(key, {
        date: key,
        label: spShortLabel(d),
        views: 0,
        clicks: 0,
      });
    }
  }

  let viewsInRange = 0;
  let clicksInRange = 0;
  let mobileEvents = 0;
  let desktopEvents = 0;
  let tabletEvents = 0;
  let otherDeviceEvents = 0;

  for (const row of clicksRangeRes.data ?? []) {
    const key = spDateKey(new Date(row.occurred_at));
    const bucket = dailyMap.get(key);
    const isView = row.event === "view";
    if (isView) viewsInRange++;
    else clicksInRange++;
    if (bucket) {
      if (isView) bucket.views++;
      else bucket.clicks++;
    }

    const dev = (row.device ?? "").toLowerCase();
    if (dev === "mobile") mobileEvents++;
    else if (dev === "desktop") desktopEvents++;
    else if (dev === "tablet") tabletEvents++;
    else otherDeviceEvents++;
  }

  const dailySeries = Array.from(dailyMap.values());
  const totalDeviceEvents =
    mobileEvents + desktopEvents + tabletEvents + otherDeviceEvents;

  // 5. Onboarding funnel counts
  const funnelCounts: Record<string, number> = {};
  for (const e of eventsRes.data ?? []) {
    funnelCounts[e.event] = (funnelCounts[e.event] ?? 0) + 1;
  }
  const topFunnel = Math.max(1, funnelCounts.slug_escolhido ?? 0);
  const publishedFunnel = funnelCounts.pagina_publicada ?? 0;
  const activationPct = pctOf(publishedPages, Math.max(1, totalProfiles));

  // 6. Donut slides (Planos, Páginas, Aparelhos)
  const donutSlides: DonutSlide[] = [
    {
      title: "Distribuição de planos",
      subtitle: "Contas por assinatura",
      centerValue: formatMetricNumber(totalProfiles),
      centerLabel: "contas totais",
      segments: [
        {
          label: "Grátis",
          value: freeCount,
          displayValue: formatMetricNumber(freeCount),
          pct: pctOf(freeCount, totalProfiles),
          color: "var(--lime)",
        },
        {
          label: "Pro",
          value: proCount,
          displayValue: formatMetricNumber(proCount),
          pct: pctOf(proCount, totalProfiles),
          color: "var(--positive)",
        },
        {
          label: "Negócios",
          value: businessCount,
          displayValue: formatMetricNumber(businessCount),
          pct: pctOf(businessCount, totalProfiles),
          color: "var(--warning)",
        },
        {
          label: "Suspensas",
          value: suspendedCount,
          displayValue: formatMetricNumber(suspendedCount),
          pct: pctOf(suspendedCount, totalProfiles),
          color: "var(--negative)",
        },
      ],
    },
    {
      title: "Status das páginas",
      subtitle: "Publicação na plataforma",
      centerValue: formatMetricNumber(allPages.length),
      centerLabel: "páginas criadas",
      segments: [
        {
          label: "Publicadas",
          value: publishedPages,
          displayValue: formatMetricNumber(publishedPages),
          pct: pctOf(publishedPages, allPages.length + accountsWithoutPage),
          color: "var(--positive)",
        },
        {
          label: "Rascunho",
          value: draftPages,
          displayValue: formatMetricNumber(draftPages),
          pct: pctOf(draftPages, allPages.length + accountsWithoutPage),
          color: "var(--warning)",
        },
        {
          label: "Bloqueadas",
          value: blockedPages,
          displayValue: formatMetricNumber(blockedPages),
          pct: pctOf(blockedPages, allPages.length + accountsWithoutPage),
          color: "var(--negative)",
        },
        {
          label: "Sem página",
          value: accountsWithoutPage,
          displayValue: formatMetricNumber(accountsWithoutPage),
          pct: pctOf(accountsWithoutPage, allPages.length + accountsWithoutPage),
          color: "var(--line-strong)",
        },
      ],
    },
    {
      title: "Aparelhos no período",
      subtitle: rangeLabel,
      centerValue: formatMetricNumber(totalDeviceEvents),
      centerLabel: "eventos no período",
      segments: [
        {
          label: "Celular",
          value: mobileEvents,
          displayValue: formatMetricNumber(mobileEvents),
          pct: pctOf(mobileEvents, totalDeviceEvents),
          color: "var(--lime)",
        },
        {
          label: "Desktop",
          value: desktopEvents,
          displayValue: formatMetricNumber(desktopEvents),
          pct: pctOf(desktopEvents, totalDeviceEvents),
          color: "var(--positive)",
        },
        {
          label: "Tablet",
          value: tabletEvents,
          displayValue: formatMetricNumber(tabletEvents),
          pct: pctOf(tabletEvents, totalDeviceEvents),
          color: "var(--warning)",
        },
        {
          label: "Outros",
          value: otherDeviceEvents,
          displayValue: formatMetricNumber(otherDeviceEvents),
          pct: pctOf(otherDeviceEvents, totalDeviceEvents),
          color: "var(--line-strong)",
        },
      ],
    },
  ];

  const openReportsCount = openReportsRes.count ?? 0;
  const waitlistCount = waitlistCountRes.count ?? 0;
  const recentProfiles = recentProfilesRes.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* LEFT MAIN COLUMN (8 cols) */}
      <div className="flex flex-col gap-5 xl:col-span-8">
        {/* Top 3 KPI Cards (matching Balance / Salary / Savings) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* KPI 1: Contas */}
          <div className="animate-rise flex flex-col justify-between gap-3 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-small font-medium text-ink-muted">
                Contas
              </span>
              <KpiArrowButton
                href="/admin/empresas"
                label="Ver todas as contas"
              />
            </div>
            <div>
              <p className="font-display text-display-md tracking-[-0.03em] text-ink">
                {formatMetricNumber(totalProfiles)}
              </p>
              <p
                className={`mt-1 text-caption font-medium ${
                  newProfilesInRange > 0 ? "text-positive" : "text-ink-muted"
                }`}
              >
                {newProfilesInRange > 0
                  ? `+${formatMetricNumber(newProfilesInRange)} no período`
                  : "Sem novos cadastros no período"}
              </p>
            </div>
          </div>

          {/* KPI 2: MRR estimado */}
          <div
            style={{ animationDelay: "50ms" }}
            className="animate-rise flex flex-col justify-between gap-3 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-small font-medium text-ink-muted">
                MRR estimado
              </span>
              <KpiArrowButton
                href="/admin/faturamento"
                label="Ver faturamento"
              />
            </div>
            <div>
              <p className="font-display text-display-md tracking-[-0.03em] text-ink">
                {formatBrl(mrrCents)}
              </p>
              <p className="mt-1 text-caption text-ink-muted">
                {formatMetricNumber(activeSubs.length)}{" "}
                {activeSubs.length === 1
                  ? "assinatura ativa"
                  : "assinaturas ativas"}
              </p>
            </div>
          </div>

          {/* KPI 3: Páginas publicadas */}
          <div
            style={{ animationDelay: "100ms" }}
            className="animate-rise flex flex-col justify-between gap-3 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-small font-medium text-ink-muted">
                Páginas no ar
              </span>
              <KpiArrowButton
                href="/admin/empresas"
                label="Ver páginas publicadas"
              />
            </div>
            <div>
              <p className="font-display text-display-md tracking-[-0.03em] text-ink">
                {formatMetricNumber(publishedPages)}
              </p>
              <p className="mt-1 text-caption text-ink-muted">
                {activationPct}% ativadas ·{" "}
                <strong className="font-semibold text-ink">
                  {formatMetricNumber(viewsInRange)}v/{formatMetricNumber(clicksInRange)}c
                </strong>
              </p>
            </div>
          </div>
        </section>

        {/* Main Smooth Dual-Line Chart (matching Income vs. Expenses) */}
        <AdminTrafficChart series={dailySeries} rangeLabel={rangeLabel} />

        {/* Bottom 2-column Bento Row (matching Your cards + Goals) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminPlanStackCard
            freeCount={freeCount}
            proCount={proCount}
            businessCount={businessCount}
            mrrCents={mrrCents}
            waitlistCount={waitlistCount}
            openReportsCount={openReportsCount}
          />

          {/* Onboarding Funnel Card (inspired by Goals) */}
          <section
            style={{ animationDelay: "220ms" }}
            className="animate-rise flex flex-col justify-between gap-4 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
                  Funil de onboarding
                </h2>
                <p className="text-caption text-ink-muted">
                  Conversão total:{" "}
                  <strong className="font-semibold text-ink">
                    {pctOf(publishedFunnel, topFunnel)}%
                  </strong>{" "}
                  ({formatMetricNumber(publishedFunnel)} publicadas)
                </p>
              </div>
              <KpiArrowButton
                href="/admin/atividades"
                label="Ver atividades do sistema"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              {FUNNEL_STEPS.map((step) => {
                const count = funnelCounts[step.key] ?? 0;
                const pct = Math.round((count / topFunnel) * 100);
                return (
                  <div key={step.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 text-caption">
                      <span className="truncate font-medium text-ink-soft">
                        {step.label}
                      </span>
                      <span className="shrink-0 font-semibold text-ink">
                        {formatMetricNumber(count)}{" "}
                        <span className="font-normal text-ink-muted">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <Progress value={pct} max={100} label={step.label} />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* RIGHT COLUMN (4 cols) */}
      <div className="flex flex-col gap-5 xl:col-span-4">
        {/* Recent Signups Card (matching Recent Transaction) */}
        <section
          style={{ animationDelay: "90ms" }}
          className="animate-rise flex flex-col gap-3 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-grid size-8 place-items-center rounded-xl bg-paper text-ink">
                <svg
                  viewBox="0 0 24 24"
                  width={16}
                  height={16}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
                </svg>
              </span>
              <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
                Cadastros recentes
              </h2>
            </div>

            <Link
              href="/admin/empresas"
              className="text-caption font-semibold text-ink-muted hover:text-ink hover:underline"
            >
              Ver todas →
            </Link>
          </div>

          {recentProfiles.length === 0 ? (
            <p className="py-6 text-center text-small text-ink-muted">
              Nenhum cadastro encontrado.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-line/70">
              {recentProfiles.map((p) => {
                const page = pageByOwner.get(p.id);
                const label =
                  page?.business_name || p.full_name || p.email || p.id;
                const planLabel =
                  p.plan === "business"
                    ? "Negócios"
                    : p.plan === "pro"
                      ? "Pro"
                      : "Grátis";

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={label} size={32} square={Boolean(page)} />
                      <div className="min-w-0">
                        <p className="truncate text-small font-semibold text-ink">
                          {label}
                        </p>
                        <p className="truncate text-caption text-ink-muted">
                          {formatSignupTime(p.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      {p.suspended_at ? (
                        <Badge variant="neutral" dot="negative">
                          Suspensa
                        </Badge>
                      ) : page ? (
                        <Link
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-[110px] truncate text-caption font-semibold text-positive hover:underline"
                        >
                          /{page.slug}
                        </Link>
                      ) : (
                        <span className="text-caption text-ink-muted">
                          Sem página
                        </span>
                      )}
                      <span className="text-[11px] text-ink-muted">
                        {planLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Segmented Donut Chart Card (matching August 2025 / Expense categories) */}
        <AdminDonutCard slides={donutSlides} />
      </div>
    </div>
  );
}
