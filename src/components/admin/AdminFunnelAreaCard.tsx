"use client";

import Link from "next/link";
import { useId } from "react";
import type { FunnelStepDatum } from "@/lib/admin/dashboard-data";

const BAR_COLORS = [
  "#5B4FE9",
  "#6D6AEF",
  "#5B9BF0",
  "#4FC1E8",
  "#4AD2D8",
  "#5CE0CC",
  "#7BE8C4",
];

export function AdminFunnelAreaCard({
  steps,
  rangeLabel,
  overallConversionPct,
  totalDropOffs,
  biggestDropLabel,
  opportunityStep,
}: {
  steps: FunnelStepDatum[];
  rangeLabel: string;
  overallConversionPct: number;
  totalDropOffs: number;
  biggestDropLabel: string;
  opportunityStep: string;
}) {
  const gradId = useId();
  const maxCount = Math.max(1, ...steps.map((s) => s.count));

  // Compute exact same percentage height for both bars and the background area
  const stepPcts = steps.map((s) =>
    s.count === 0 ? 4 : Math.max(10, Math.round((s.count / maxCount) * 100)),
  );

  // Build smooth area path behind the stepped bars using the exact same Y coordinates
  const svgW = 800;
  const svgH = 96;
  const colW = svgW / Math.max(1, steps.length);
  const areaPoints = stepPcts.map((pct, idx) => {
    const x = idx * colW + 24;
    const y = svgH * (1 - pct / 100);
    return { x, y };
  });

  const areaPath =
    areaPoints.length > 0
      ? [
          `M 0 ${areaPoints[0].y.toFixed(1)}`,
          `L ${areaPoints[0].x.toFixed(1)} ${areaPoints[0].y.toFixed(1)}`,
          ...areaPoints.slice(1).map((p, i) => {
            const prev = areaPoints[i];
            const cx = ((prev.x + p.x) / 2).toFixed(1);
            return `C ${cx} ${prev.y.toFixed(1)}, ${cx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          }),
          `L ${svgW} ${areaPoints[areaPoints.length - 1].y.toFixed(1)}`,
          `L ${svgW} ${svgH}`,
          `L 0 ${svgH} Z`,
        ].join(" ")
      : "";

  return (
    <section className="flex flex-col justify-between rounded-[10px] border border-[#EAECF0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-semibold text-[#101828]">
              Funil de ativação
            </h2>
            <span className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-2 text-[12px] leading-none font-semibold text-[#5B4FE9]">
              Principal
            </span>
          </div>
          <p className="mt-0.5 text-[14px] font-medium text-[#667085]">
            {steps.length} etapas · {rangeLabel}
          </p>
        </div>

        <Link
          href="/admin/atividades"
          className="inline-flex h-7 items-center rounded-lg border border-[#D0D5DD] bg-white px-2.5 text-[14px] font-medium text-[#344054] transition-colors hover:bg-[#F9FAFB]"
        >
          Ver atividades
        </Link>
      </div>

      {/* Step headers */}
      <div
        className="mt-2.5 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, steps.length)}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step, i) => (
          <div
            key={step.key}
            className={`min-w-0 ${i > 0 ? "border-l border-[#F2F4F7] pl-2" : ""}`}
          >
            <p className="truncate text-[14px] font-medium text-[#667085]">
              {step.shortLabel}
            </p>
            <p className="mt-0.5 text-[20px] font-bold tracking-tight text-[#101828] tabular-nums sm:text-[22px]">
              {step.count.toLocaleString("pt-BR")}
            </p>
            <p className="text-[13px] font-medium text-[#98A2B3] tabular-nums">
              {step.pctOfTop}%
            </p>
          </div>
        ))}
      </div>

      {/* Stepped bars + continuous area ribbon */}
      <div className="relative mt-2 h-24 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5B4FE9" stopOpacity="0.24" />
              <stop offset="55%" stopColor="#4FC1E8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7BE8C4" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        </svg>

        <div
          className="relative z-10 grid h-full items-end gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, steps.length)}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((step, idx) => {
            const pct = stepPcts[idx];
            return (
              <div key={step.key} className="flex h-full items-end">
                <div
                  className="w-11 rounded-t-[6px] transition-all duration-300 sm:w-14"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                  }}
                  title={`${step.label}: ${step.count} (${step.pctOfTop}%)`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[#F2F4F7] pt-2.5 sm:grid-cols-4">
        <div>
          <p className="text-[14px] font-medium text-[#667085]">
            Conversão geral
          </p>
          <p className="mt-0.5 text-[17px] font-bold text-[#5B4FE9] tabular-nums">
            {overallConversionPct.toFixed(1)}%
          </p>
        </div>
        <div className="sm:border-l sm:border-[#F2F4F7] sm:pl-2.5">
          <p className="text-[14px] font-medium text-[#667085]">
            Total de abandonos
          </p>
          <p className="mt-0.5 text-[17px] font-bold text-[#101828] tabular-nums">
            {totalDropOffs.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="sm:border-l sm:border-[#F2F4F7] sm:pl-2.5">
          <p className="text-[14px] font-medium text-[#667085]">
            Maior queda
          </p>
          <p className="mt-0.5 truncate text-[14px] font-semibold text-[#EF4444]">
            {biggestDropLabel}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:border-l sm:border-[#F2F4F7] sm:pl-2.5">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#667085]">
              Oportunidade
            </p>
            <p className="mt-0.5 truncate text-[14px] font-semibold text-[#101828]">
              {opportunityStep}
            </p>
          </div>
          <Link
            href="/admin/atividades"
            className="inline-flex h-5 shrink-0 items-center rounded-md bg-[#EEF0FF] px-2 text-[12px] leading-none font-semibold text-[#5B4FE9] hover:bg-[#E0E4FF]"
          >
            Detalhes
          </Link>
        </div>
      </div>
    </section>
  );
}
