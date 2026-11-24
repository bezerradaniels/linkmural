import Link from "next/link";
import { UserHeroCard } from "@/components/app/UserHeroCard";
import {
  UserPerformanceChart,
  type UserDailyPoint,
} from "@/components/app/UserPerformanceChart";
import { Alert, Avatar, Icon, Progress } from "@/components/ui";
import { getPanelContext } from "@/lib/panel-data";
import {
  calcDeltaPercent,
  formatDelta,
  formatMetricNumber,
} from "@/lib/panel-helpers";
import { planInfo } from "@/lib/plans";
import { mediaUrl } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

function getDateOffsets() {
  const now = Date.now();
  return {
    from59: new Date(now - 59 * 86_400_000).toISOString().slice(0, 10),
    today: new Date(now).toISOString().slice(0, 10),
  };
}

function shortDayLabel(isoDay: string): string {
  const [, m, d] = isoDay.split("-");
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const monthIdx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${Number(d)} ${months[monthIdx]}`;
}

export default async function AppHomePage() {
  const { profile, page, plan, downgraded } = await getPanelContext();
  const limits = planInfo(plan);
  const pageUrl = `${siteUrl()}/${page.slug}`;
  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const avatarUrl = mediaUrl(page.avatar_path);
  const { from59, today } = getDateOffsets();

  // Fetch 60 days of daily stats to compute last 30d + delta vs previous 30d.
  const supabase = await createClient();
  const { data: statsRows } = await supabase.rpc("page_stats_daily", {
    p_page: page.id,
    p_from: from59,
    p_to: today,
  });

  const rows = statsRows ?? [];
  const prev30 = rows.slice(0, 30);
  const last30 = rows.slice(30);

  const views30 = last30.reduce((s, r) => s + Number(r.views ?? 0), 0);
  const clicks30 = last30.reduce((s, r) => s + Number(r.clicks ?? 0), 0);
  const prevViews = prev30.reduce((s, r) => s + Number(r.views ?? 0), 0);
  const prevClicks = prev30.reduce((s, r) => s + Number(r.clicks ?? 0), 0);

  const total30 = views30 + clicks30;
  const prevTotal = prevViews + prevClicks;
  const totalDeltaPct = calcDeltaPercent(total30, prevTotal);
  const totalDeltaLabel = formatDelta(totalDeltaPct);

  const viewsDeltaPct = calcDeltaPercent(views30, prevViews);
  const clicksDeltaPct = calcDeltaPercent(clicks30, prevClicks);
  const viewsDelta = formatDelta(viewsDeltaPct);
  const clicksDelta = formatDelta(clicksDeltaPct);

  const ctrPct = views30 > 0 ? Math.round((clicks30 / views30) * 100) : 0;

  const dailySeries: UserDailyPoint[] = last30.map((r) => ({
    day: String(r.day),
    label: shortDayLabel(String(r.day)),
    views: Number(r.views ?? 0),
    clicks: Number(r.clicks ?? 0),
  }));

  // Check onboarding_events for checklist items.
  let copiedLink = false;
  let downloadedQr = false;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: evs } = await createAdminClient()
        .from("onboarding_events")
        .select("event")
        .eq("page_id", page.id)
        .in("event", ["link_copiado", "qr_baixado"]);
      for (const e of evs ?? []) {
        if (e.event === "link_copiado") copiedLink = true;
        if (e.event === "qr_baixado") downloadedQr = true;
      }
    } catch {
      // Ignore if migration hasn't been applied yet
    }
  }

  const checklist = [
    {
      label: "Logo e descrição",
      done: Boolean(page.avatar_path && page.bio),
      href: "/app/informacoes",
    },
    {
      label: "WhatsApp e horários",
      done: Boolean(page.whatsapp && page.hours),
      href: "/app/informacoes",
    },
    {
      label: "Primeiro link",
      done: page.links.length > 0,
      href: "/app/pagina",
    },
    {
      label: "Modelo da página",
      done: page.onboarding_step >= 7 || page.template !== "balcao",
      href: "/app/aparencia",
    },
    {
      label: "Link na bio",
      done: copiedLink,
      href: "#compartilhar",
    },
    {
      label: "Baixar QR code",
      done: downloadedQr,
      href: "#compartilhar",
    },
  ];

  const doneCount = checklist.filter((c) => c.done).length;
  const activeLinks = page.links.filter((l) => l.active);
  const linkCount = page.links.length;
  const pausedCount = linkCount - activeLinks.length;
  const nearLinkLimit =
    limits.maxLinks !== null && linkCount >= limits.maxLinks - 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Minimalist Top Greeting */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-display-md tracking-[-0.03em] text-ink">
          Olá{firstName ? `, ${firstName}` : ""}!
        </h1>

        <Link
          href="/app/conta"
          aria-label="Minha conta"
          className="hidden items-center gap-2.5 rounded-pill border border-line bg-surface py-1 pr-3.5 pl-1.5 shadow-sm transition-colors hover:border-line-strong lg:inline-flex"
        >
          <Avatar
            src={avatarUrl}
            name={page.business_name || page.slug}
            size={32}
          />
          <span className="max-w-[140px] truncate text-caption font-semibold text-ink">
            {page.business_name || page.slug}
          </span>
        </Link>
      </div>

      {/* Contextual Alerts (only when relevant) */}
      {downgraded && (
        <Alert tone="warning" title="Plano voltou para o Grátis">
          {pausedCount > 0
            ? `${pausedCount} ${pausedCount === 1 ? "link pausado" : "links pausados"} acima do limite.`
            : "Recursos Pro desativados."}{" "}
          <Link href="/app/plano" className="font-semibold underline">
            Reativar Pro →
          </Link>
        </Alert>
      )}

      {nearLinkLimit && !downgraded && (
        <Alert tone="warning" title={`${linkCount} de ${limits.maxLinks} links usados`}>
          <Link href="/app/plano" className="font-semibold underline">
            Assinar Pro para links ilimitados →
          </Link>
        </Alert>
      )}

      {/* Main Responsive Bento Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN (7 cols) */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* Hero Dark Ink + Electric Lime Card */}
          <div id="compartilhar">
            <UserHeroCard
              pageId={page.id}
              slug={page.slug}
              pageUrl={pageUrl}
              published={page.published}
              totalInteractions30={total30}
              deltaLabel={totalDeltaLabel}
              deltaPositive={(totalDeltaPct ?? 0) >= 0}
            />
          </div>

          {/* 2x2 Clean Minimal KPI Cards (inspired by Market Direction / Momentum) */}
          <section
            aria-label="Métricas dos últimos 30 dias"
            className="grid grid-cols-2 gap-3.5"
          >
            <Link
              href="/app/metricas"
              style={{ animationDelay: "50ms" }}
              className="animate-rise flex flex-col justify-between gap-2 rounded-[22px] border border-line/70 bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-caption font-medium text-ink-muted">
                Visitas
              </span>
              <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
                {formatMetricNumber(views30)}
              </span>
              <span
                className={`text-caption font-semibold ${
                  viewsDeltaPct === null
                    ? "text-ink-muted"
                    : viewsDeltaPct >= 0
                      ? "text-positive"
                      : "text-negative"
                }`}
              >
                {viewsDelta ? `${viewsDelta} 30d` : "Últimos 30d"}
              </span>
            </Link>

            <Link
              href="/app/metricas"
              style={{ animationDelay: "90ms" }}
              className="animate-rise flex flex-col justify-between gap-2 rounded-[22px] border border-line/70 bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-caption font-medium text-ink-muted">
                Cliques
              </span>
              <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
                {formatMetricNumber(clicks30)}
              </span>
              <span
                className={`text-caption font-semibold ${
                  clicksDeltaPct === null
                    ? "text-ink-muted"
                    : clicksDeltaPct >= 0
                      ? "text-positive"
                      : "text-negative"
                }`}
              >
                {clicksDelta ? `${clicksDelta} 30d` : "Últimos 30d"}
              </span>
            </Link>

            <Link
              href="/app/metricas"
              style={{ animationDelay: "130ms" }}
              className="animate-rise flex flex-col justify-between gap-2 rounded-[22px] border border-line/70 bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-caption font-medium text-ink-muted">
                Conversão
              </span>
              <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
                {ctrPct}%
              </span>
              <span className="text-caption text-ink-muted">
                cliques / visitas
              </span>
            </Link>

            <Link
              href="/app/pagina"
              style={{ animationDelay: "170ms" }}
              className="animate-rise flex flex-col justify-between gap-2 rounded-[22px] border border-line/70 bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-caption font-medium text-ink-muted">
                Links ativos
              </span>
              <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink">
                {limits.maxLinks !== null
                  ? `${linkCount}/${limits.maxLinks}`
                  : formatMetricNumber(activeLinks.length)}
              </span>
              {limits.maxLinks !== null ? (
                <Progress
                  value={linkCount}
                  max={limits.maxLinks}
                  label="Uso de links"
                  tone={linkCount >= limits.maxLinks ? "warning" : "default"}
                />
              ) : (
                <span className="text-caption font-medium text-positive">
                  Ilimitados
                </span>
              )}
            </Link>
          </section>

          {/* Active Links Preview List (inspired by "Stock Activities" floating cards) */}
          <section
            style={{ animationDelay: "190ms" }}
            className="animate-rise flex flex-col gap-3"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
                Seus links
              </h2>
              <Link
                href="/app/pagina"
                className="text-caption font-semibold text-ink-muted hover:text-ink"
              >
                Gerenciar →
              </Link>
            </div>

            {activeLinks.length === 0 ? (
              <Link
                href="/app/pagina"
                className="flex items-center justify-between gap-3 rounded-[20px] border border-dashed border-line-strong bg-surface p-4 text-small font-medium text-ink-muted transition-colors hover:border-ink hover:text-ink"
              >
                <span>Adicionar primeiro link</span>
                <span className="inline-grid size-8 place-items-center rounded-full bg-lime text-on-lime">
                  <Icon name="plus" size={16} />
                </span>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                {activeLinks.slice(0, 4).map((link) => (
                  <Link
                    key={link.id}
                    href="/app/pagina"
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-line/70 bg-surface px-4 py-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-grid size-9 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                        <Icon name="link" size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-small font-semibold text-ink">
                          {link.title}
                        </p>
                        {link.subtitle && (
                          <p className="truncate text-caption text-ink-muted">
                            {link.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                      Editar
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols) */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* Interactive Performance Chart + Dual CTAs */}
          <UserPerformanceChart series={dailySeries} />

          {/* Compact Checklist (hidden once 100% done) */}
          {doneCount < checklist.length && (
            <section
              style={{ animationDelay: "210ms" }}
              className="animate-rise flex flex-col gap-3.5 rounded-[26px] border border-line/70 bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
                  Primeiros passos
                </h2>
                <span className="rounded-pill bg-lime-soft px-2.5 py-0.5 text-caption font-semibold text-ink">
                  {doneCount}/{checklist.length}
                </span>
              </div>

              <Progress
                value={doneCount}
                max={checklist.length}
                label="Progresso"
              />

              <ul className="flex flex-col divide-y divide-line/60">
                {checklist.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center justify-between gap-3 py-2 text-small transition-colors hover:text-ink"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                            item.done
                              ? "border-ink bg-ink text-lime"
                              : "border-line-strong bg-paper text-transparent"
                          }`}
                        >
                          <Icon name="check" size={12} />
                        </span>
                        <span
                          className={
                            item.done
                              ? "text-caption text-ink-muted line-through"
                              : "text-small font-medium text-ink"
                          }
                        >
                          {item.label}
                        </span>
                      </span>
                      {!item.done && (
                        <Icon
                          name="arrow"
                          size={14}
                          className="text-ink-muted"
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
