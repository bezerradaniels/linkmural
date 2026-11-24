"use client";

import { useId } from "react";
import type { KpiSparkData } from "@/lib/admin/dashboard-data";
import { buildSmoothLinePath } from "@/lib/admin/svg-curve";

function buildSparkPaths(series: number[], width: number, height: number) {
  const safe = series.length >= 2 ? series : [0, ...series, 0];
  const max = Math.max(1, ...safe);
  const min = Math.min(0, ...safe);
  const span = Math.max(1, max - min);
  const padY = 4;

  const points = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * width;
    const y = height - padY - ((v - min) / span) * (height - padY * 2);
    return { x, y };
  });

  const line = buildSmoothLinePath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return { line, area };
}

export function AdminKpiSparkCard({ item }: { item: KpiSparkData }) {
  const gradId = useId();
  const { line, area } = buildSparkPaths(item.series, 200, 36);

  const delta = item.deltaPct ?? 0;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const isGood = item.positiveIsGood ? delta >= 0 : delta <= 0;

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-[10px] border border-[#EAECF0] bg-white pt-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="px-3">
        <p className="truncate text-[15px] font-medium text-[#667085]">
          {item.label}
        </p>
        <p className="mt-0.5 text-[24px] leading-tight font-bold tracking-tight text-[#101828] tabular-nums">
          {item.value}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[14px] font-medium">
          <span
            className={`font-semibold tabular-nums ${
              isGood ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            {isUp ? "↑" : isDown ? "↓" : "•"} {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="truncate text-[#98A2B3]">{item.compareLabel}</span>
        </p>
      </div>

      <svg
        viewBox="0 0 200 36"
        preserveAspectRatio="none"
        className="mt-1 h-6 w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={item.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={item.color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={item.color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
