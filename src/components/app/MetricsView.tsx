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

function shortDate(isoDay: string): string {
  const [, month, day] = isoDay.split("-");
  return `${day}/${month}`;
}

export function MetricsView({
  daily60,
  waTimestamps,
  referenceMs,
  plan,
}: {
  daily60: DailyPoint[];
  waTimestamps: string[];
  referenceMs: number;
  plan: Plan;
}) {
  const [period, setPeriod] = useState<"7" | "30">("7");
  const days = Number(period);

  const stats = useMemo(() => {
    const currentSlice = daily60.slice(-days);
    const prevSlice = daily60.slice(-(days * 2), -days);

    const views = currentSlice.reduce((s, d) => s + d.views, 0);
    const clicks = currentSlice.reduce((s, d) => s + d.clicks, 0);
    const prevViews = prevSlice.reduce((s, d) => s + d.views, 0);
    const prevClicks = prevSlice.reduce((s, d) => s + d.clicks, 0);

    const curStart = referenceMs - days * 86_400_000;
    const prevStart = referenceMs - days * 2 * 86_400_000;

    let waCur = 0;
    let waPrev = 0;
    for (const ts of waTimestamps) {
      const ms = Date.parse(ts);
      if (ms >= curStart) waCur += 1;
      else if (ms >= prevStart) waPrev += 1;
    }

    const maxClicks = Math.max(1, ...currentSlice.map((d) => d.clicks));

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
    };
  }, [daily60, waTimestamps, days, referenceMs]);

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

        <Segmented<"7" | "30">
          label="Período"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "7", label: "7 dias" },
            { value: "30", label: "30 dias" },
          ]}
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

      {/* Locked Pro/Business block */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-title tracking-[-0.02em]">
            Cliques por link e origem dos visitantes
          </h2>
          {plan === "free" && (
            <Badge variant="pro">
              <Icon name="lock" size={12} />
              Pro
            </Badge>
          )}
        </div>

        <p className="text-small text-ink-muted">
          {plan === "free"
            ? "Descubra qual link mais converte e de onde vêm seus visitantes (Instagram, Google, WhatsApp)."
            : "Detalhamento por link e origem disponível nas próximas atualizações."}
        </p>

        {plan === "free" && (
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
        )}
      </section>
    </div>
  );
}
