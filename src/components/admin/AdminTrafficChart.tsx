"use client";

import { useMemo, useState } from "react";
import { formatMetricNumber } from "@/lib/panel-helpers";

export type DailyTrafficPoint = {
  /** YYYY-MM-DD in America/Sao_Paulo */
  date: string;
  /** Short pt-BR label, e.g. "23 nov" */
  label: string;
  views: number;
  clicks: number;
};

type Point = { x: number; y: number };

/** Catmull-Rom to cubic Bezier smooth SVG path. */
function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function AdminTrafficChart({
  series,
  rangeLabel,
}: {
  series: DailyTrafficPoint[];
  rangeLabel?: string;
}) {
  const [mode, setMode] = useState<"curve" | "bars">("curve");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const visible = series;
  const width = 680;
  const height = 250;
  const pad = { top: 58, right: 24, bottom: 34, left: 24 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const baselineY = pad.top + plotH;

  const {
    maxVal,
    viewPts,
    clickPts,
    totalViews,
    totalClicks,
    peakIndex,
    avgY,
  } = useMemo(() => {
    let max = 0;
    let tViews = 0;
    let tClicks = 0;
    let bestIdx = Math.max(0, visible.length - 1);
    let bestScore = -1;

    visible.forEach((p, idx) => {
      tViews += p.views;
      tClicks += p.clicks;
      if (p.views > max) max = p.views;
      if (p.clicks > max) max = p.clicks;
      const score = p.views + p.clicks;
      if (score >= bestScore && score > 0) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    const top = Math.max(4, Math.ceil(max * 1.15));
    const count = visible.length;
    const xFor = (i: number) =>
      count <= 1 ? pad.left + plotW / 2 : pad.left + (i / (count - 1)) * plotW;
    const yFor = (val: number) =>
      pad.top + plotH - (Math.max(0, val) / top) * plotH;

    const vPts: Point[] = visible.map((p, i) => ({
      x: xFor(i),
      y: yFor(p.views),
    }));
    const cPts: Point[] = visible.map((p, i) => ({
      x: xFor(i),
      y: yFor(p.clicks),
    }));

    const avgViews = count > 0 ? tViews / count : 0;

    return {
      maxVal: top,
      viewPts: vPts,
      clickPts: cPts,
      totalViews: tViews,
      totalClicks: tClicks,
      peakIndex: bestIdx,
      avgY: yFor(avgViews),
    };
  }, [visible, pad.left, pad.top, plotW, plotH]);

  const viewLine = buildSmoothPath(viewPts);
  const clickLine = buildSmoothPath(clickPts);
  const viewArea =
    viewPts.length > 1
      ? `${viewLine} L ${viewPts[viewPts.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${viewPts[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
      : "";

  // Highlight hovered day, or default to the peak day (Kiwi style) when data exists
  const activeIndex =
    hoveredIndex !== null && hoveredIndex < visible.length
      ? hoveredIndex
      : visible.length > 0 && (totalViews > 0 || totalClicks > 0)
        ? peakIndex
        : null;

  const activePoint = activeIndex !== null ? visible[activeIndex] : null;
  const activeViewCoord = activeIndex !== null ? viewPts[activeIndex] : null;
  const activeClickCoord = activeIndex !== null ? clickPts[activeIndex] : null;

  const firstLabel = visible[0]?.label ?? "";
  const lastLabel = visible[visible.length - 1]?.label ?? "";
  const xLabelStep = Math.max(1, Math.ceil(visible.length / 7));

  // Bar geometry for paired capsule bars mode
  const slotW = plotW / Math.max(1, visible.length);
  const barW = Math.max(4, Math.min(10, slotW * 0.24));
  const barGap = Math.max(2, Math.min(4, slotW * 0.08));

  return (
    <section
      style={{ animationDelay: "120ms" }}
      className="animate-rise flex flex-col gap-4 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-title tracking-[-0.02em] text-ink">
            Visitas vs. Cliques
          </h2>
          <p className="text-caption text-ink-muted">
            {firstLabel && lastLabel
              ? `${firstLabel} – ${lastLabel}`
              : "Tráfego consolidado das páginas públicas"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Curve / Bars Mode Switcher */}
          <div
            role="group"
            aria-label="Tipo de gráfico"
            className="inline-flex items-center gap-0.5 rounded-pill border border-line bg-paper p-0.5"
          >
            <button
              type="button"
              onClick={() => setMode("curve")}
              aria-pressed={mode === "curve"}
              className={`min-h-7 cursor-pointer rounded-pill px-2.5 text-caption font-semibold transition-all ${
                mode === "curve"
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Curva
            </button>
            <button
              type="button"
              onClick={() => setMode("bars")}
              aria-pressed={mode === "bars"}
              className={`min-h-7 cursor-pointer rounded-pill px-2.5 text-caption font-semibold transition-all ${
                mode === "bars"
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Barras
            </button>
          </div>

          <span className="hidden min-h-8 items-center rounded-pill border border-line bg-paper px-3 text-caption font-semibold text-ink-soft sm:inline-flex">
            {rangeLabel ??
              `${visible.length} ${visible.length === 1 ? "dia" : "dias"}`}
          </span>
        </div>
      </div>

      {/* Minimalist Legend Pills */}
      <div className="flex flex-wrap items-center gap-5 text-small">
        <span className="inline-flex items-center gap-2 text-ink-soft">
          <span
            className="size-2.5 rounded-full"
            style={{ background: "var(--positive)" }}
          />
          <span className="text-caption text-ink-muted">Visitas</span>
          <strong className="font-display text-body font-semibold text-ink">
            {formatMetricNumber(totalViews)}
          </strong>
        </span>

        <span className="inline-flex items-center gap-2 text-ink-soft">
          <span
            className="size-2.5 rounded-full"
            style={{ background: "var(--ink)" }}
          />
          <span className="text-caption text-ink-muted">Cliques</span>
          <strong className="font-display text-body font-semibold text-ink">
            {formatMetricNumber(totalClicks)}
          </strong>
        </span>
      </div>

      {/* Modern Open-Canvas SVG Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-60 w-full overflow-visible sm:h-64"
          role="img"
          aria-label={`Gráfico de visitas e cliques no período selecionado. Total: ${totalViews} visitas e ${totalClicks} cliques.`}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="lmModernViewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity="0.22" />
              <stop offset="65%" stopColor="var(--lime)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lmModernStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--line-strong)" />
              <stop offset="35%" stopColor="var(--positive)" />
              <stop offset="100%" stopColor="var(--positive)" />
            </linearGradient>
            <filter
              id="lmSoftGlow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="4"
                floodColor="var(--positive)"
                floodOpacity="0.28"
              />
            </filter>
          </defs>

          {/* Subtle average reference dashed line (Kiwi style) */}
          {totalViews > 0 && (
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={avgY}
              y2={avgY}
              stroke="var(--line)"
              strokeDasharray="4 5"
              strokeWidth={1.1}
            />
          )}

          {/* Subtle baseline */}
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={baselineY}
            y2={baselineY}
            stroke="var(--line)"
            strokeOpacity={0.6}
            strokeWidth={1}
          />

          {mode === "curve" ? (
            <>
              {/* Soft Area Glow under Visits */}
              {viewArea && (
                <path
                  key={`area-${firstLabel}-${lastLabel}`}
                  d={viewArea}
                  fill="url(#lmModernViewsFill)"
                  className="animate-fade-in"
                />
              )}

              {/* Secondary curve: Clicks (thin, subtle) */}
              {clickLine && (
                <path
                  key={`clicks-${firstLabel}-${lastLabel}`}
                  d={clickLine}
                  pathLength={1}
                  strokeDasharray={1}
                  fill="none"
                  stroke="var(--ink)"
                  strokeOpacity={0.35}
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="animate-draw-line"
                />
              )}

              {/* Primary curve: Visits (vibrant emerald with subtle glow) */}
              {viewLine && (
                <path
                  key={`views-${firstLabel}-${lastLabel}`}
                  d={viewLine}
                  pathLength={1}
                  strokeDasharray={1}
                  fill="none"
                  stroke="url(#lmModernStroke)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  filter="url(#lmSoftGlow)"
                  className="animate-draw-line"
                />
              )}

              {/* Active vertical guide + concentric glowing dot */}
              {activeViewCoord && activeClickCoord && activePoint && (
                <g>
                  <line
                    x1={activeViewCoord.x}
                    x2={activeViewCoord.x}
                    y1={Math.min(activeViewCoord.y, activeClickCoord.y) + 8}
                    y2={baselineY}
                    stroke="var(--line-strong)"
                    strokeDasharray="3 4"
                    strokeWidth={1.3}
                  />

                  {/* Clicks dot */}
                  <circle
                    cx={activeClickCoord.x}
                    cy={activeClickCoord.y}
                    r={4.5}
                    fill="var(--surface)"
                    stroke="var(--ink)"
                    strokeWidth={2.2}
                  />

                  {/* Glowing concentric halo for Visits (Kiwi target dot) */}
                  <circle
                    cx={activeViewCoord.x}
                    cy={activeViewCoord.y}
                    r={11}
                    fill="var(--positive)"
                    fillOpacity={0.18}
                  />
                  <circle
                    cx={activeViewCoord.x}
                    cy={activeViewCoord.y}
                    r={5.5}
                    fill="var(--positive)"
                    stroke="var(--surface)"
                    strokeWidth={2.5}
                  />
                </g>
              )}
            </>
          ) : (
            /* Paired Rounded Capsule Bars Mode (Kiwi Ride-style bars) */
            <g>
              {visible.map((point, i) => {
                const cx = pad.left + slotW * i + slotW / 2;
                const isActive = activeIndex === i;
                const vH = Math.max(
                  point.views > 0 ? 8 : 3,
                  (point.views / maxVal) * plotH,
                );
                const cH = Math.max(
                  point.clicks > 0 ? 8 : 3,
                  (point.clicks / maxVal) * plotH,
                );
                const vX = cx - barW - barGap / 2;
                const cX = cx + barGap / 2;

                return (
                  <g key={point.date}>
                    {/* Clicks bar (left, ink/muted) */}
                    <rect
                      x={vX}
                      y={baselineY - cH}
                      width={barW}
                      height={cH}
                      rx={barW / 2}
                      fill={isActive ? "var(--ink)" : "var(--line-strong)"}
                      fillOpacity={isActive ? 0.9 : 0.45}
                      className="transition-all duration-200"
                    />
                    {/* Visits bar (right, vibrant positive/lime) */}
                    <rect
                      x={cX}
                      y={baselineY - vH}
                      width={barW}
                      height={vH}
                      rx={barW / 2}
                      fill={isActive ? "var(--positive)" : "var(--positive)"}
                      fillOpacity={isActive ? 1 : 0.35}
                      filter={isActive ? "url(#lmSoftGlow)" : undefined}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Floating Dark Capsule Tooltip (Kiwi signature dark pill) */}
          {activePoint && activeViewCoord && activeClickCoord && (
            (() => {
              const anchorX =
                mode === "curve"
                  ? activeViewCoord.x
                  : pad.left + slotW * activeIndex! + slotW / 2;
              const anchorY = Math.min(activeViewCoord.y, activeClickCoord.y);
              const tipW = 132;
              const tipH = 44;
              const clampedX = Math.max(
                8,
                Math.min(width - tipW - 8, anchorX - tipW / 2),
              );
              const tipY = Math.max(2, anchorY - tipH - 16);

              return (
                <g className="pointer-events-none transition-all duration-150">
                  <rect
                    x={clampedX}
                    y={tipY}
                    width={tipW}
                    height={tipH}
                    rx={12}
                    fill="var(--ink)"
                  />
                  {/* Date line */}
                  <text
                    x={clampedX + tipW / 2}
                    y={tipY + 16}
                    textAnchor="middle"
                    fill="var(--paper)"
                    fillOpacity={0.68}
                    fontSize={10}
                    fontWeight={500}
                  >
                    {activePoint.label}
                  </text>
                  {/* Metrics line */}
                  <text
                    x={clampedX + tipW / 2}
                    y={tipY + 33}
                    textAnchor="middle"
                    fill="var(--paper)"
                    fontSize={12}
                    fontWeight={700}
                  >
                    {formatMetricNumber(activePoint.views)} v ·{" "}
                    {formatMetricNumber(activePoint.clicks)} c
                  </text>
                </g>
              );
            })()
          )}

          {/* Clean X-axis labels (active day highlighted) */}
          {visible.map((point, i) => {
            const isLast = i === visible.length - 1;
            const isActive = activeIndex === i;
            if (i % xLabelStep !== 0 && !isLast && !isActive) return null;
            const xPos =
              mode === "curve"
                ? (viewPts[i]?.x ?? pad.left)
                : pad.left + slotW * i + slotW / 2;
            return (
              <text
                key={point.date}
                x={xPos}
                y={height - 8}
                textAnchor={
                  i === 0 ? "start" : isLast ? "end" : "middle"
                }
                fill={isActive ? "var(--ink)" : "var(--ink-muted)"}
                fontSize={11}
                fontWeight={isActive ? 700 : 500}
              >
                {point.label}
              </text>
            );
          })}

          {/* Invisible hover columns for effortless scrubbing */}
          {visible.map((point, i) => {
            const xCenter =
              mode === "curve"
                ? (viewPts[i]?.x ?? pad.left)
                : pad.left + slotW * i + slotW / 2;
            return (
              <rect
                key={`hit-${point.date}`}
                x={xCenter - slotW / 2}
                y={pad.top - 24}
                width={slotW}
                height={plotH + 34}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}
        </svg>

        {totalViews === 0 && totalClicks === 0 && (
          <p className="mt-1 text-center text-caption text-ink-muted">
            Sem eventos de tráfego registrados neste período.
          </p>
        )}
      </div>
    </section>
  );
}
