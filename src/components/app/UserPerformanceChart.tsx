"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { formatMetricNumber } from "@/lib/panel-helpers";

export type UserDailyPoint = {
  day: string;
  label: string;
  views: number;
  clicks: number;
};

type Point = { x: number; y: number };

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

export function UserPerformanceChart({
  series,
}: {
  series: UserDailyPoint[];
}) {
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visible = useMemo(() => {
    const slice = series.slice(-days);
    return slice.length > 0 ? slice : series;
  }, [series, days]);

  const width = 560;
  const height = 210;
  const pad = { top: 44, right: 16, bottom: 28, left: 16 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const baselineY = pad.top + plotH;

  const { viewPts, totalViews, totalClicks, peakIdx } = useMemo(() => {
    let max = 0;
    let tViews = 0;
    let tClicks = 0;
    let bestIdx = Math.max(0, visible.length - 1);
    let bestVal = -1;

    visible.forEach((p, idx) => {
      tViews += p.views;
      tClicks += p.clicks;
      const combined = p.views + p.clicks;
      if (p.views > max) max = p.views;
      if (combined >= bestVal && combined > 0) {
        bestVal = combined;
        bestIdx = idx;
      }
    });

    const top = Math.max(4, Math.ceil(max * 1.15));
    const count = visible.length;
    const xFor = (i: number) =>
      count <= 1 ? pad.left + plotW / 2 : pad.left + (i / (count - 1)) * plotW;
    const yFor = (val: number) =>
      pad.top + plotH - (Math.max(0, val) / top) * plotH;

    return {
      viewPts: visible.map((p, i) => ({ x: xFor(i), y: yFor(p.views) })),
      totalViews: tViews,
      totalClicks: tClicks,
      peakIdx: bestIdx,
    };
  }, [visible, pad.left, pad.top, plotW, plotH]);

  const linePath = buildSmoothPath(viewPts);
  const areaPath =
    viewPts.length > 1
      ? `${linePath} L ${viewPts[viewPts.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${viewPts[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
      : "";

  const activeIdx =
    hoveredIdx !== null && hoveredIdx < visible.length
      ? hoveredIdx
      : visible.length > 0 && (totalViews > 0 || totalClicks > 0)
        ? peakIdx
        : null;

  const activePoint = activeIdx !== null ? visible[activeIdx] : null;
  const activeCoord = activeIdx !== null ? viewPts[activeIdx] : null;
  const xStep = Math.max(1, Math.ceil(visible.length / 5));

  return (
    <section
      style={{ animationDelay: "120ms" }}
      className="animate-rise flex flex-col gap-4 rounded-[26px] border border-line/70 bg-surface p-5 shadow-sm"
    >
      {/* Top Row: Title + Period Pills (matching 1D / 5D / 1W / 1M) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
            Desempenho
          </h2>
          <Link
            href="/app/metricas"
            className="text-caption font-medium text-ink-muted hover:text-ink"
          >
            Detalhes →
          </Link>
        </div>

        <div
          role="group"
          aria-label="Período"
          className="inline-flex items-center gap-1"
        >
          {([7, 14, 30] as const).map((d) => {
            const active = days === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDays(d);
                  setHoveredIdx(null);
                }}
                aria-pressed={active}
                className={`min-h-8 cursor-pointer rounded-pill px-3 text-caption font-semibold transition-all ${
                  active
                    ? "bg-ink text-paper shadow-sm"
                    : "text-ink-muted hover:bg-paper hover:text-ink"
                }`}
              >
                {d}D
              </button>
            );
          })}
        </div>
      </div>

      {/* Smooth Emerald Curve Chart (Screen 3 inspiration) */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-48 w-full overflow-visible sm:h-52"
          role="img"
          aria-label={`Desempenho dos últimos ${days} dias: ${totalViews} visitas e ${totalClicks} cliques.`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="lmUserChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal baseline */}
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={baselineY}
            y2={baselineY}
            stroke="var(--line)"
            strokeOpacity={0.6}
          />

          {/* Area fill */}
          {areaPath && (
            <path
              key={`u-area-${days}`}
              d={areaPath}
              fill="url(#lmUserChartFill)"
              className="animate-fade-in"
            />
          )}

          {/* Main curve */}
          {linePath && (
            <path
              key={`u-line-${days}`}
              d={linePath}
              pathLength={1}
              strokeDasharray={1}
              fill="none"
              stroke="var(--positive)"
              strokeWidth={2.8}
              strokeLinecap="round"
              className="animate-draw-line"
            />
          )}

          {/* Crosshair + Emerald Dot + Dark Floating Card (Screen 3) */}
          {activeCoord && activePoint && (
            <g>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={activeCoord.y}
                y2={activeCoord.y}
                stroke="var(--line-strong)"
                strokeDasharray="3 4"
                strokeWidth={1}
              />
              <line
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1={pad.top}
                y2={baselineY}
                stroke="var(--line-strong)"
                strokeDasharray="3 4"
                strokeWidth={1}
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={9}
                fill="var(--positive)"
                fillOpacity={0.18}
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={4.5}
                fill="var(--positive)"
                stroke="var(--surface)"
                strokeWidth={2.2}
              />

              {/* Floating Dark Tooltip Card */}
              {(() => {
                const tipW = 132;
                const tipH = 44;
                const clampedX = Math.max(
                  8,
                  Math.min(width - tipW - 8, activeCoord.x - tipW / 2),
                );
                const tipY = Math.max(2, activeCoord.y - tipH - 14);
                return (
                  <g className="pointer-events-none">
                    <rect
                      x={clampedX}
                      y={tipY}
                      width={tipW}
                      height={tipH}
                      rx={12}
                      fill="var(--ink)"
                    />
                    <text
                      x={clampedX + tipW / 2}
                      y={tipY + 16}
                      textAnchor="middle"
                      fill="var(--paper)"
                      fillOpacity={0.65}
                      fontSize={10}
                      fontWeight={500}
                    >
                      {activePoint.label}
                    </text>
                    <text
                      x={clampedX + tipW / 2}
                      y={tipY + 33}
                      textAnchor="middle"
                      fill="var(--paper)"
                      fontSize={11.5}
                      fontWeight={700}
                    >
                      {formatMetricNumber(activePoint.views)} vis ·{" "}
                      {formatMetricNumber(activePoint.clicks)} clq
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* X-axis labels */}
          {visible.map((point, i) => {
            const isLast = i === visible.length - 1;
            const isActive = activeIdx === i;
            if (i % xStep !== 0 && !isLast && !isActive) return null;
            const x = viewPts[i]?.x ?? pad.left;
            return (
              <text
                key={point.day}
                x={x}
                y={height - 6}
                textAnchor={i === 0 ? "start" : isLast ? "end" : "middle"}
                fill={isActive ? "var(--ink)" : "var(--ink-muted)"}
                fontSize={10.5}
                fontWeight={isActive ? 700 : 500}
              >
                {point.label}
              </text>
            );
          })}

          {/* Hover hit columns */}
          {visible.map((point, i) => {
            const slotW = plotW / Math.max(1, visible.length);
            const x = viewPts[i]?.x ?? pad.left;
            return (
              <rect
                key={`hit-${point.day}`}
                x={x - slotW / 2}
                y={pad.top - 16}
                width={slotW}
                height={plotH + 24}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom Dual Action Buttons (matching dark "Sell" + lime "Buy" from Screen 3) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Link
          href="/app/pagina"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-small font-semibold text-paper transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <span>Meus links</span>
          <Icon name="arrow" size={15} />
        </Link>

        <Link
          href="/app/aparencia"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-lime px-4 text-small font-semibold text-on-lime transition-all hover:bg-lime-strong active:scale-[0.98]"
        >
          <span>Aparência</span>
          <Icon name="palette" size={15} />
        </Link>
      </div>
    </section>
  );
}
