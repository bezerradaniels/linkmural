"use client";

import Link from "next/link";
import type { PerformanceRowDatum } from "@/lib/admin/dashboard-data";
import { buildSmoothLinePath } from "@/lib/admin/svg-curve";

function miniSparkPath(series: number[], width: number, height: number): string {
  const safe = series.length >= 2 ? series : [0, ...series, 0];
  const max = Math.max(1, ...safe);
  const min = Math.min(0, ...safe);
  const span = Math.max(1, max - min);
  const points = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * width;
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return { x, y };
  });
  return buildSmoothLinePath(points);
}

export function AdminPerformanceListCard({
  rows,
}: {
  rows: PerformanceRowDatum[];
}) {
  return (
    <section className="flex flex-col justify-between rounded-[10px] border border-[#EAECF0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-[#101828]">
            Resumo da base
          </h2>
          <Link
            href="/admin/empresas"
            className="inline-flex h-7 items-center rounded-lg border border-[#D0D5DD] bg-white px-2.5 text-[14px] font-medium text-[#344054] transition-colors hover:bg-[#F9FAFB]"
          >
            Ver todos
          </Link>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-[#F2F4F7] pb-1 text-[12px] font-semibold tracking-wider text-[#98A2B3] uppercase">
          <span>Categoria</span>
          <span className="text-right">Total / %</span>
          <span className="w-12 text-right">Tendência</span>
        </div>

        <div className="divide-y divide-[#F2F4F7]">
          {rows.map((row) => {
            const path = miniSparkPath(row.series, 48, 18);
            const stroke = row.trendPositive ? "#10B981" : "#EF4444";
            return (
              <Link
                key={row.id}
                href={row.href}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-1.5 transition-colors hover:bg-[#F9FAFB]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold"
                    style={{ backgroundColor: row.bgTint, color: row.color }}
                  >
                    {row.label.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[#101828]">
                      {row.label}
                    </p>
                    <p className="truncate text-[13px] font-medium text-[#98A2B3]">
                      {row.sublabel}
                    </p>
                  </div>
                </div>

                <span className="text-[15px] font-semibold text-[#101828] tabular-nums">
                  {row.metric}
                </span>

                <svg
                  viewBox="0 0 48 18"
                  className="h-4.5 w-12 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        href="/admin/empresas"
        className="mt-2.5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#5B4FE9] hover:text-[#4338CA]"
      >
        Ver todas as empresas →
      </Link>
    </section>
  );
}
