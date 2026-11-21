"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  buttonClasses,
  EmptyState,
  Icon,
  Segmented,
} from "@/components/ui";
import {
  summarizeActionEvents,
  summarizeLinkClicks,
  type MetricClickEvent,
  type MetricLinkInput,
} from "@/lib/metrics-helpers";
import {
  calcDeltaPercent,
  formatDelta,
  formatMetricNumber,
} from "@/lib/panel-helpers";
import type { Plan } from "@/lib/plans";

type DailyPoint = {
  day: string;
  views: number;
  clicks: number;
};

type PeriodOption = "7" | "30" | "90";

function shortDate(isoDay: string): string {
  const [, month, day] = isoDay.split("-");
  return `${day}/${month}`;
}

export function MetricsView({
  daily,
  clickEvents,
  links,
  referenceMs,
  plan,
}: {
  daily: DailyPoint[];
  clickEvents: MetricClickEvent[];
  links: MetricLinkInput[];
  referenceMs: number;
  plan: Plan;
}) {
  const isPro = plan !== "free";
  const [period, setPeriod] = useState<PeriodOption>("7");
  const days = Number(period);

  const stats = useMemo(() => {
    const currentSlice = daily.slice(-days);
    const prevSlice = daily.slice(-(days * 2), -days);

    const views = currentSlice.reduce((s, d) => s + d.views, 0);
    const clicks = currentSlice.reduce((s, d) => s + d.clicks, 0);
    const prevViews = prevSlice.reduce((s, d) => s + d.views, 0);
    const prevClicks = prevSlice.reduce((s, d) => s + d.clicks, 0);

    const curStart = referenceMs - days * 86_400_000;
    const prevStart = referenceMs - days * 2 * 86_400_000;

    let waCur = 0;
    let waPrev = 0;
    for (const ev of clickEvents) {
      if (ev.event !== "whatsapp") continue;
      const ms = Date.parse(ev.occurred_at);
      if (ms >= curStart) waCur += 1;
      else if (ms >= prevStart) waPrev += 1;
    }

    const maxClicks = Math.max(1, ...currentSlice.map((d) => d.clicks));
    const perLink = isPro ? summarizeLinkClicks(links, clickEvents, curStart) : [];
    const maxLinkClicks = Math.max(1, ...perLink.map((l) => l.clicks));
    const actions = isPro
      ? summarizeActionEvents(clickEvents, curStart)
      : { whatsapp: 0, contact: 0, qr: 0 };

    return {
      series: currentSlice,
      views,
      clicks,
      waCur,
      viewsDelta: formatDelta(calcDeltaPercent(views, prevViews)),
      clicksDelta: formatDelta(calcDeltaPercent(clicks, prevClicks)),
      waDelta: formatDelta(calcDeltaPercent(waCur, waPrev)),
      maxClicks,
      hasAnyData: views > 0 || clicks > 0,
      perLink,
      maxLinkClicks,
      hasAnyLinkClick: perLink.some((l) => l.clicks > 0),
      actions,
    };
  }, [daily, clickEvents, links, days, referenceMs, isPro]);

  const periodOptions: { value: PeriodOption; label: string }[] = isPro
    ? [
        { value: "7", label: "7 dias" },
        { value: "30", label: "30 dias" },
        { value: "90", label: "90 dias" },
      ]
    : [
        { value: "7", label: "7 dias" },
        { value: "30", label: "30 dias" },
      ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display-md tracking-[-0.03em]">
            Métricas
          </h1>
          <p className="text-small text-ink-muted">
            Visitas e cliques sem coletar dados pessoais dos visitantes.
          </p>
        </div>

        <Segmented<PeriodOption>
          label="Período"
          value={period}
          onChange={setPeriod}
          options={periodOptions}
        />
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-5">
          <span className="text-caption font-medium text-ink-muted">
            Visitas ({days} dias)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-display-md">
              {formatMetricNumber(stats.views)}
            </span>
            {stats.viewsDelta && (
              <Badge variant="neutral">{stats.viewsDelta}</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-5">
          <span className="text-caption font-medium text-ink-muted">
            Cliques ({days} dias)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-display-md">
              {formatMetricNumber(stats.clicks)}
            </span>
            {stats.clicksDelta && (
              <Badge variant="neutral">{stats.clicksDelta}</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-5">
          <span className="text-caption font-medium text-ink-muted">
            Toques no WhatsApp ({days} dias)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-display-md">
              {formatMetricNumber(stats.waCur)}
            </span>
            {stats.waDelta && <Badge variant="neutral">{stats.waDelta}</Badge>}
          </div>
        </div>
      </section>

      {/* Daily Clicks Bar Chart */}
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-title tracking-[-0.02em]">
            Cliques por dia
          </h2>
          <span className="text-caption text-ink-muted">
            Últimos {days} dias (horário de Brasília)
          </span>
        </div>

        {!stats.hasAnyData ? (
          <EmptyState
            icon="chart"
            title="Ainda sem visitas neste período"
            text="Compartilhe seu link na bio ou imprima o QR code para começar a ver os cliques aqui."
          />
        ) : (
          <div className="flex flex-col gap-2">
            <div
              role="img"
              aria-label={`Gráfico de cliques dos últimos ${days} dias`}
              className="flex h-44 items-end gap-1 pt-4"
            >
              {stats.series.map((point) => {
                const heightPct =
                  point.clicks > 0
                    ? Math.max(
                        8,
                        Math.round((point.clicks / stats.maxClicks) * 100),
                      )
                    : 2;
                return (
                  <div
                    key={point.day}
                    title={`${shortDate(point.day)}: ${point.clicks} cliques, ${point.views} visitas`}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        point.clicks > 0
                          ? "bg-ink group-hover:bg-lime"
                          : "bg-hover"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-caption text-ink-muted">
              <span>
                {stats.series[0] ? shortDate(stats.series[0].day) : ""}
              </span>
              <span>
                {stats.series.length > 0
                  ? shortDate(stats.series[stats.series.length - 1].day)
                  : ""}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Per-link clicks (Pro+) or lock card (Free) */}
      {!isPro ? (
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-title tracking-[-0.02em]">
              Cliques por link e períodos maiores
            </h2>
            <Badge variant="pro">
              <Icon name="lock" size={12} />
              Pro
            </Badge>
          </div>

          <p className="text-small text-ink-muted">
            Descubra qual link mais converte, acompanhe ações de contato/QR e
            veja histórico de até 90 dias.
          </p>

          <Link
            href="/app/plano"
            className={buttonClasses({
              variant: "outline",
              size: "md",
              className: "self-start",
            })}
          >
            Ver planos
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-title tracking-[-0.02em]">
                Cliques por link
              </h2>
              <p className="text-caption text-ink-muted">
                Desempenho de cada link nos últimos {days} dias
              </p>
            </div>
            {(stats.actions.contact > 0 || stats.actions.qr > 0) && (
              <div className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
                {stats.actions.contact > 0 && (
                  <Badge variant="neutral">
                    Salvar contato: {formatMetricNumber(stats.actions.contact)}
                  </Badge>
                )}
                {stats.actions.qr > 0 && (
                  <Badge variant="neutral">
                    QR Code: {formatMetricNumber(stats.actions.qr)}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {stats.perLink.length === 0 || !stats.hasAnyLinkClick ? (
            <EmptyState
              icon="chart"
              title="Ainda sem cliques nos links neste período"
              text="Assim que os visitantes clicarem nos seus links, o ranking aparece aqui."
            />
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {stats.perLink.map((item) => {
                const barWidth =
                  item.clicks > 0
                    ? Math.max(6, Math.round((item.clicks / stats.maxLinkClicks) * 100))
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-small font-medium">
                          {item.title}
                        </span>
                        {item.featured && (
                          <Badge variant="outline">Destaque</Badge>
                        )}
                        {!item.active && (
                          <Badge variant="neutral">Pausado</Badge>
                        )}
                      </div>
                      <div className="flex shrink-0 items-baseline gap-2">
                        <span className="text-small font-semibold tabular-nums">
                          {formatMetricNumber(item.clicks)}
                        </span>
                        <span className="w-10 text-right text-caption text-ink-muted tabular-nums">
                          {item.sharePct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full bg-ink transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
