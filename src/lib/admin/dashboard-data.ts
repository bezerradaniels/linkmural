import { PAID_STATUSES } from "@/lib/billing-core";
import { PLANS, formatBrl } from "@/lib/plans";
import { createAdminClient } from "@/utils/supabase/admin";

export const SAO_PAULO_TZ = "America/Sao_Paulo";

export const FUNNEL_STEPS = [
  { key: "signup", label: "Cadastro", shortLabel: "1. Cadastro" },
  {
    key: "email_verified",
    label: "E-mail verificado",
    shortLabel: "2. E-mail verificado",
  },
  {
    key: "published",
    label: "Página publicada",
    shortLabel: "3. Página publicada",
  },
  { key: "subscribed", label: "Assinante", shortLabel: "4. Assinante" },
] as const;

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

export function spDateKey(date: Date): string {
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

function addDaysIso(isoDay: string, deltaDays: number): string {
  const dt = parseIsoDay(isoDay) ?? new Date();
  return spDateKey(new Date(dt.getTime() + deltaDays * 86_400_000));
}

function spMidnightIso(isoDay: string, endOfDay = false): string {
  return endOfDay
    ? `${isoDay}T23:59:59.999-03:00`
    : `${isoDay}T00:00:00.000-03:00`;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function pctOf(value: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

export type AdminDateRange = {
  fromKey: string;
  toKey: string;
  prevFromKey: string;
  prevToKey: string;
  rangeLabel: string;
  prevRangeLabel: string;
  daysCount: number;
};

export function parseAdminDateRange(params: {
  from?: string;
  to?: string;
  preset?: string;
}): AdminDateRange {
  const now = new Date();
  const todayKey = spDateKey(now);
  const defaultFromDate = new Date(now.getTime() - 13 * 86_400_000);
  const parsedFrom = parseIsoDay(params.from);
  const parsedTo = parseIsoDay(params.to);

  let fromKey = parsedFrom ? params.from! : spDateKey(defaultFromDate);
  let toKey = parsedTo ? params.to! : todayKey;
  if (fromKey > toKey) {
    const tmp = fromKey;
    fromKey = toKey;
    toKey = tmp;
  }
  if (toKey > todayKey) toKey = todayKey;

  const fromDt = parseIsoDay(fromKey) ?? defaultFromDate;
  const toDt = parseIsoDay(toKey) ?? now;
  const daysCount = Math.max(
    1,
    Math.min(180, Math.round((toDt.getTime() - fromDt.getTime()) / 86_400_000) + 1),
  );

  const prevToKey = addDaysIso(fromKey, -1);
  const prevFromKey = addDaysIso(prevToKey, -(daysCount - 1));

  const rangeLabel =
    (params.preset && PRESET_LABELS[params.preset]) ||
    (params.from || params.to ? "Período personalizado" : "Últimos 14 dias");

  const prevStartDt = parseIsoDay(prevFromKey) ?? fromDt;
  const prevEndDt = parseIsoDay(prevToKey) ?? fromDt;
  const prevRangeLabel = `${spShortLabel(prevStartDt)} – ${spShortLabel(prevEndDt)}`;

  return {
    fromKey,
    toKey,
    prevFromKey,
    prevToKey,
    rangeLabel,
    prevRangeLabel,
    daysCount,
  };
}

export type KpiSparkData = {
  id: string;
  label: string;
  value: string;
  deltaPct: number | null;
  /** True when higher delta is positive (green); false when lower is better (e.g. abandonment) */
  positiveIsGood: boolean;
  compareLabel: string;
  color: string;
  series: number[];
};

export type FunnelStepDatum = {
  key: string;
  label: string;
  shortLabel: string;
  count: number;
  pctOfTop: number;
};

export type PerformanceRowDatum = {
  id: string;
  label: string;
  sublabel: string;
  metric: string;
  href: string;
  color: string;
  bgTint: string;
  series: number[];
  trendPositive: boolean;
};

export type DailyTrendPoint = {
  date: string;
  label: string;
  views: number;
  clicks: number;
  signups: number;
  published: number;
};

export type InsightDatum = {
  id: string;
  tone: "danger" | "emerald" | "indigo";
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export type HorizontalRankDatum = {
  id: string;
  label: string;
  count: number;
  pct: number;
  color: string;
};

export type AdminDashboardData = {
  range: AdminDateRange;
  kpis: KpiSparkData[];
  funnel: {
    steps: FunnelStepDatum[];
    overallConversionPct: number;
    totalDropOffs: number;
    biggestDropLabel: string;
    biggestDropCount: number;
    opportunityStep: string;
  };
  performanceRows: PerformanceRowDatum[];
  dailySeries: DailyTrendPoint[];
  insights: InsightDatum[];
  deviceBreakdown: HorizontalRankDatum[];
  sourceBreakdown: HorizontalRankDatum[];
  totals: {
    totalProfiles: number;
    publishedPages: number;
    draftPages: number;
    blockedPages: number;
    mrrCents: number;
    viewsInRange: number;
    clicksInRange: number;
    openReports: number;
  };
};

export async function getAdminDashboardData(
  range: AdminDateRange,
): Promise<AdminDashboardData> {
  const admin = createAdminClient();
  const prevStartIso = spMidnightIso(range.prevFromKey, false);
  const rangeEndIso = spMidnightIso(range.toKey, true);

  const [
    profilesAllRes,
    pagesAllRes,
    openReportsRes,
    clicksWindowRes,
    eventsWindowRes,
    activeSubsRes,
    authUsersRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, plan, created_at, suspended_at")
      .limit(10000),
    admin
      .from("pages")
      .select("owner_id, published, blocked_at, created_at")
      .limit(10000),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("click_events")
      .select("event, occurred_at, device")
      .gte("occurred_at", prevStartIso)
      .lte("occurred_at", rangeEndIso)
      .limit(40000),
    admin
      .from("onboarding_events")
      .select("event, occurred_at, metadata")
      .gte("occurred_at", prevStartIso)
      .lte("occurred_at", rangeEndIso)
      .limit(15000),
    admin
      .from("subscriptions")
      .select("user_id, plan, billing_interval, status, created_at")
      .in("status", [...PAID_STATUSES]),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  // Build daily map for current range
  const startCursor = parseIsoDay(range.fromKey) ?? new Date();
  const dailyMap = new Map<string, DailyTrendPoint>();
  for (let i = 0; i < range.daysCount; i++) {
    const d = new Date(startCursor.getTime() + i * 86_400_000);
    const key = spDateKey(d);
    dailyMap.set(key, {
      date: key,
      label: spShortLabel(d),
      views: 0,
      clicks: 0,
      signups: 0,
      published: 0,
    });
  }

  // 1. Profiles & plans
  const allProfiles = profilesAllRes.data ?? [];
  const totalProfiles = allProfiles.length;
  let newProfilesCur = 0;
  let newProfilesPrev = 0;
  let freeCount = 0;
  let proCount = 0;
  let businessCount = 0;

  for (const p of allProfiles) {
    if (p.plan === "business") businessCount++;
    else if (p.plan === "pro") proCount++;
    else freeCount++;

    const day = spDateKey(new Date(p.created_at));
    if (day >= range.fromKey && day <= range.toKey) {
      newProfilesCur++;
      const b = dailyMap.get(day);
      if (b) b.signups++;
    } else if (day >= range.prevFromKey && day <= range.prevToKey) {
      newProfilesPrev++;
    }
  }

  // 2. Pages
  const allPages = pagesAllRes.data ?? [];
  let publishedPages = 0;
  let draftPages = 0;
  let blockedPages = 0;
  let newPublishedCur = 0;
  let newPublishedPrev = 0;
  const ownersWithPage = new Set<string>();
  const ownersWithPublishedPage = new Set<string>();

  for (const p of allPages) {
    ownersWithPage.add(p.owner_id);
    if (p.blocked_at) blockedPages++;
    else if (p.published) {
      publishedPages++;
      ownersWithPublishedPage.add(p.owner_id);
    } else draftPages++;

    if (p.published && !p.blocked_at) {
      const day = spDateKey(new Date(p.created_at));
      if (day >= range.fromKey && day <= range.toKey) {
        newPublishedCur++;
        const b = dailyMap.get(day);
        if (b) b.published++;
      } else if (day >= range.prevFromKey && day <= range.prevToKey) {
        newPublishedPrev++;
      }
    }
  }
  const accountsWithoutPage = Math.max(0, totalProfiles - ownersWithPage.size);

  // 3. Subscriptions & MRR
  const activeSubs = activeSubsRes.data ?? [];
  const paidSubOwners = new Set<string>();
  let mrrCents = 0;
  let newMrrCur = 0;
  let newMrrPrev = 0;

  for (const sub of activeSubs) {
    paidSubOwners.add(sub.user_id);
    const tier = sub.plan === "business" ? PLANS.business : PLANS.pro;
    const monthly =
      sub.billing_interval === "year"
        ? Math.round(tier.price.yearly / 12)
        : tier.price.monthly;
    mrrCents += monthly;
    const day = spDateKey(new Date(sub.created_at));
    if (day >= range.fromKey && day <= range.toKey) newMrrCur += monthly;
    else if (day >= range.prevFromKey && day <= range.prevToKey) newMrrPrev += monthly;
  }

  // 4. Clicks & Views (current + previous range)
  let viewsCur = 0;
  let clicksCur = 0;
  let viewsPrev = 0;
  let mobileEvents = 0;
  let desktopEvents = 0;
  let tabletEvents = 0;
  let otherDeviceEvents = 0;

  for (const row of clicksWindowRes.data ?? []) {
    const day = spDateKey(new Date(row.occurred_at));
    const isView = row.event === "view";
    if (day >= range.fromKey && day <= range.toKey) {
      if (isView) viewsCur++;
      else clicksCur++;
      const b = dailyMap.get(day);
      if (b) {
        if (isView) b.views++;
        else b.clicks++;
      }
      const dev = (row.device ?? "").toLowerCase();
      if (dev === "mobile") mobileEvents++;
      else if (dev === "desktop") desktopEvents++;
      else if (dev === "tablet") tabletEvents++;
      else otherDeviceEvents++;
    } else if (day >= range.prevFromKey && day <= range.prevToKey) {
      if (isView) viewsPrev++;
    }
  }

  // 5. Cohort funnel (Signup -> Email verified -> Published -> Subscribed) & UTM sources
  const verifiedUserIds = new Set<string>();
  for (const u of authUsersRes.data?.users ?? []) {
    if (u.email_confirmed_at) {
      verifiedUserIds.add(u.id);
    }
  }

  const sourceCounts = new Map<string, number>();
  for (const e of eventsWindowRes.data ?? []) {
    const day = spDateKey(new Date(e.occurred_at));
    if (
      day >= range.fromKey &&
      day <= range.toKey &&
      e.event === "origem_capturada" &&
      e.metadata &&
      typeof e.metadata === "object"
    ) {
      const meta = e.metadata as Record<string, unknown>;
      const rawSrc =
        (typeof meta.utm_source === "string" && meta.utm_source.trim()) ||
        (typeof meta.referer === "string" && meta.referer.trim()) ||
        "Direto";
      const label = rawSrc.length > 26 ? `${rawSrc.slice(0, 24)}…` : rawSrc;
      sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
    }
  }

  let signupCur = 0;
  let verifiedCur = 0;
  let publishedCohortCur = 0;
  let subscribedCohortCur = 0;

  let signupPrev = 0;
  let publishedCohortPrev = 0;

  for (const p of allProfiles) {
    const day = spDateKey(new Date(p.created_at));
    const isVerified = verifiedUserIds.has(p.id);
    const isPub = ownersWithPublishedPage.has(p.id);
    const isSub = paidSubOwners.has(p.id) || p.plan !== "free";

    if (day >= range.fromKey && day <= range.toKey) {
      signupCur++;
      if (isVerified) verifiedCur++;
      if (isVerified && isPub) publishedCohortCur++;
      if (isVerified && isPub && isSub) subscribedCohortCur++;
    } else if (day >= range.prevFromKey && day <= range.prevToKey) {
      signupPrev++;
      if (isVerified && isPub) publishedCohortPrev++;
    }
  }

  const funnelCountMap: Record<string, number> = {
    signup: signupCur,
    email_verified: verifiedCur,
    published: publishedCohortCur,
    subscribed: subscribedCohortCur,
  };

  const convCur = signupCur > 0 ? pctOf(subscribedCohortCur, signupCur) : 0;
  const activationCur = signupCur > 0 ? pctOf(publishedCohortCur, signupCur) : 0;
  const abandonCur = Number((100 - activationCur).toFixed(1));

  const activationPrev =
    signupPrev > 0 ? pctOf(publishedCohortPrev, signupPrev) : 0;
  const abandonPrev = Number((100 - activationPrev).toFixed(1));

  const steps: FunnelStepDatum[] = FUNNEL_STEPS.map((s) => {
    const count = funnelCountMap[s.key] ?? 0;
    return {
      key: s.key,
      label: s.label,
      shortLabel: s.shortLabel,
      count,
      pctOfTop: signupCur > 0 ? pctOf(count, signupCur) : 0,
    };
  });

  let biggestDropLabel = "Sem quedas registradas";
  let biggestDropCount = 0;
  let opportunityStep = "Funil equilibrado";
  for (let i = 0; i < steps.length - 1; i++) {
    const drop = Math.max(0, steps[i].count - steps[i + 1].count);
    if (drop > biggestDropCount) {
      biggestDropCount = drop;
      biggestDropLabel = `${steps[i].label} → ${steps[i + 1].label} (${drop})`;
      opportunityStep = steps[i + 1].label;
    }
  }

  const dailySeries = Array.from(dailyMap.values());
  const signupsSpark = dailySeries.map((d) => d.signups);
  const publishedSpark = dailySeries.map((d) => d.published);
  const viewsSpark = dailySeries.map((d) => d.views);
  const clicksSpark = dailySeries.map((d) => d.clicks);

  const kpis: KpiSparkData[] = [
    {
      id: "mrr",
      label: "MRR ativo",
      value: formatBrl(mrrCents),
      deltaPct: pctDelta(newMrrCur, newMrrPrev),
      positiveIsGood: true,
      compareLabel: `vs ${range.prevRangeLabel}`,
      color: "#6366F1",
      series: publishedSpark.map((v, i) => v + (signupsSpark[i] ?? 0)),
    },
    {
      id: "accounts",
      label: "Novas contas",
      value: newProfilesCur.toLocaleString("pt-BR"),
      deltaPct: pctDelta(newProfilesCur, newProfilesPrev),
      positiveIsGood: true,
      compareLabel: `vs ${range.prevRangeLabel}`,
      color: "#10B981",
      series: signupsSpark,
    },
    {
      id: "published",
      label: "Páginas publicadas",
      value: publishedPages.toLocaleString("pt-BR"),
      deltaPct: pctDelta(newPublishedCur, newPublishedPrev),
      positiveIsGood: true,
      compareLabel: `vs ${range.prevRangeLabel}`,
      color: "#3B82F6",
      series: publishedSpark,
    },
    {
      id: "views",
      label: "Visualizações",
      value: viewsCur.toLocaleString("pt-BR"),
      deltaPct: pctDelta(viewsCur, viewsPrev),
      positiveIsGood: true,
      compareLabel: `vs ${range.prevRangeLabel}`,
      color: "#14B8A6",
      series: viewsSpark,
    },
    {
      id: "abandon",
      label: "Abandono no funil",
      value: `${abandonCur.toFixed(1)}%`,
      deltaPct:
        signupPrev > 0
          ? Number((abandonCur - abandonPrev).toFixed(1))
          : 0,
      positiveIsGood: false,
      compareLabel: `vs ${range.prevRangeLabel}`,
      color: "#EF4444",
      series: steps.map((s) => Math.max(0, 100 - s.pctOfTop)),
    },
  ];

  const openReports = openReportsRes.count ?? 0;
  const totalPlans = Math.max(1, freeCount + proCount + businessCount);

  const performanceRows: PerformanceRowDatum[] = [
    {
      id: "pro",
      label: "Plano Pro",
      sublabel: `${proCount} assinantes`,
      metric: `${pctOf(proCount, totalPlans)}%`,
      href: "/admin/faturamento",
      color: "#5B4FE9",
      bgTint: "#EEF0FF",
      series: publishedSpark,
      trendPositive: true,
    },
    {
      id: "business",
      label: "Plano Business",
      sublabel: `${businessCount} assinantes`,
      metric: `${pctOf(businessCount, totalPlans)}%`,
      href: "/admin/faturamento",
      color: "#0EA5E9",
      bgTint: "#E0F2FE",
      series: clicksSpark,
      trendPositive: true,
    },
    {
      id: "free",
      label: "Plano Free",
      sublabel: `${freeCount} contas`,
      metric: `${pctOf(freeCount, totalPlans)}%`,
      href: "/admin/empresas",
      color: "#10B981",
      bgTint: "#D1FAE5",
      series: signupsSpark,
      trendPositive: true,
    },
    {
      id: "drafts",
      label: "Páginas rascunho",
      sublabel: "Ainda não publicadas",
      metric: draftPages.toLocaleString("pt-BR"),
      href: "/admin/empresas",
      color: "#F59E0B",
      bgTint: "#FEF3C7",
      series: signupsSpark.map((v, i) => Math.max(0, v - (publishedSpark[i] ?? 0))),
      trendPositive: true,
    },
    {
      id: "reports",
      label: "Denúncias abertas",
      sublabel: openReports > 0 ? "Aguardando revisão" : "Fila zerada",
      metric: openReports.toLocaleString("pt-BR"),
      href: "/admin/moderacao",
      color: "#EF4444",
      bgTint: "#FEE2E2",
      series: [openReports, openReports, openReports, openReports],
      trendPositive: openReports === 0,
    },
  ];

  const insights: InsightDatum[] = [
    {
      id: "funnel-drop",
      tone: "danger",
      title:
        biggestDropCount > 0
          ? "Maior queda no onboarding"
          : "Funil sem quedas críticas",
      description:
        biggestDropCount > 0
          ? `${biggestDropLabel} não avançaram no período.`
          : "Todas as etapas estão fluindo bem no período.",
      ctaLabel: "Ver atividades →",
      href: "/admin/atividades",
    },
    {
      id: "no-page",
      tone: "emerald",
      title: "Contas sem página criada",
      description: `${accountsWithoutPage.toLocaleString("pt-BR")} contas ainda não finalizaram o primeiro mural.`,
      ctaLabel: "Ver empresas →",
      href: "/admin/empresas",
    },
    {
      id: "moderation",
      tone: "indigo",
      title:
        openReports > 0
          ? `${openReports} denúncias abertas`
          : "Moderação em dia",
      description:
        openReports > 0
          ? "Há páginas sinalizadas aguardando análise."
          : "Nenhuma denúncia pendente na fila.",
      ctaLabel: "Ir para moderação →",
      href: "/admin/moderacao",
    },
  ];

  const totalDevices = Math.max(
    1,
    mobileEvents + desktopEvents + tabletEvents + otherDeviceEvents,
  );
  const deviceBreakdown: HorizontalRankDatum[] = [
    {
      id: "mobile",
      label: "Mobile",
      count: mobileEvents,
      pct: pctOf(mobileEvents, totalDevices),
      color: "#5B4FE9",
    },
    {
      id: "desktop",
      label: "Desktop",
      count: desktopEvents,
      pct: pctOf(desktopEvents, totalDevices),
      color: "#38BDF8",
    },
    {
      id: "tablet",
      label: "Tablet",
      count: tabletEvents,
      pct: pctOf(tabletEvents, totalDevices),
      color: "#2DD4BF",
    },
    {
      id: "other",
      label: "Outros",
      count: otherDeviceEvents,
      pct: pctOf(otherDeviceEvents, totalDevices),
      color: "#A7F3D0",
    },
  ];

  const totalSources = Math.max(
    1,
    Array.from(sourceCounts.values()).reduce((a, b) => a + b, 0),
  );
  const sourceColors = ["#5B4FE9", "#38BDF8", "#2DD4BF", "#6EE7B7", "#C4B5FD"];
  const sourceBreakdown: HorizontalRankDatum[] = Array.from(
    sourceCounts.entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count], idx) => ({
      id: `src-${idx}`,
      label,
      count,
      pct: pctOf(count, totalSources),
      color: sourceColors[idx % sourceColors.length],
    }));

  return {
    range,
    kpis,
    funnel: {
      steps,
      overallConversionPct: convCur,
      totalDropOffs: Math.max(0, signupCur - subscribedCohortCur),
      biggestDropLabel,
      biggestDropCount,
      opportunityStep,
    },
    performanceRows,
    dailySeries,
    insights,
    deviceBreakdown,
    sourceBreakdown,
    totals: {
      totalProfiles,
      publishedPages,
      draftPages,
      blockedPages,
      mrrCents,
      viewsInRange: viewsCur,
      clicksInRange: clicksCur,
      openReports,
    },
  };
}
