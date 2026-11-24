"use client";

import { useState } from "react";
import type { DailyTrendPoint } from "@/lib/admin/dashboard-data";
import { buildSmoothLinePath } from "@/lib/admin/svg-curve";

type Mode = "traffic" | "growth";

export function AdminTrendLinesCard({
  series,
}: {
  series: DailyTrendPoint[];
}) {
  const [mode, setMode] = useState<Mode>("traffic");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const primaryKey = mode === "traffic" ? "views" : "signups";
  const secondaryKey = mode === "traffic" ? "clicks" : "published";
  const primaryLabel = mode === "traffic" ? "Visualizações" : "Novas contas";
  const secondaryLabel = mode === "traffic" ? "Cliques" : "Publicações";

  const maxVal = Math.max(
    4,
    ...series.map((d) => Math.max(d[primaryKey], d[secondaryKey])),
  );

  const w = 480;
  const h = 160;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  function toCoords(key: "views" | "clicks" | "signups" | "published") {
    return series.map((d, i) => {
      const x =
        series.length <= 1
          ? padL + plotW / 2
          : padL + (i / (series.length - 1)) * plotW;
      const y = padT + plotH - (d[key] / maxVal) * plotH;
      return { x, y, val: d[key], label: d.label };
    });
  }

  const p1 = toCoords(primaryKey);
  const p2 = toCoords(secondaryKey);
  const line1 = buildSmoothLinePath(p1);
  const line2 = buildSmoothLinePath(p2);

  const ticks = [0, 0.33, 0.66, 1].map((r) => ({
    y: padT + plotH - r * plotH,
    val: Math.round(r * maxVal),
  }));

  const xLabelStep = Math.max(1, Math.ceil(series.length / 6));
  const hovered = hoverIdx !== null ? series[hoverIdx] : null;

  return (
    <section className="flex flex-col justify-between rounded-[10px] border border-[#EAECF0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-semibold text-[#101828]">
          Tendência no período
        </h2>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          aria-label="Selecionar métrica do gráfico"
          className="h-7 cursor-pointer rounded-lg border border-[#D0D5DD] bg-white px-2 text-[13px] font-medium text-[#344054] outline-none focus:border-[#5B4FE9]"
        >
          <option value="traffic">Views &amp; Cliques</option>
          <option value="growth">Contas &amp; Publicações</option>
        </select>
      </div>

      <div className="relative mt-1.5">
        {hovered && (
          <div className="pointer-events-none absolute top-0 right-2 z-10 rounded-lg border border-[#EAECF0] bg-white px-2.5 py-1.5 text-[11px] font-medium shadow-sm">
            <p className="font-semibold text-[#101828]">{hovered.label}</p>
            <p className="text-[#5B4FE9]">
              {primaryLabel}: {hovered[primaryKey].toLocaleString("pt-BR")}
            </p>
            <p className="text-[#14B8A6]">
              {secondaryLabel}: {hovered[secondaryKey].toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-32 w-full"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={w - padR}
                y1={t.y}
                y2={t.y}
                stroke="#F2F4F7"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={t.y + 3}
                textAnchor="end"
                className="fill-[#98A2B3] text-[9px]"
              >
                {t.val}
              </text>
            </g>
          ))}

          {series.map((d, i) => {
            if (i % xLabelStep !== 0 && i !== series.length - 1) return null;
            const x =
              series.length <= 1
                ? padL + plotW / 2
                : padL + (i / (series.length - 1)) * plotW;
            return (
              <text
                key={d.date}
                x={x}
                y={h - 4}
                textAnchor="middle"
                className="fill-[#98A2B3] text-[9px]"
              >
                {d.label}
              </text>
            );
          })}

          {line1 && (
            <path
              d={line1}
              fill="none"
              stroke="#5B4FE9"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {line2 && (
            <path
              d={line2}
              fill="none"
              stroke="#14B8A6"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {p1.map((pt, i) => (
            <g key={i} onMouseEnter={() => setHoverIdx(i)}>
              <rect
                x={pt.x - 10}
                y={padT}
                width={20}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIdx === i ? 3.5 : 2.2}
                fill="#5B4FE9"
                stroke="#FFFFFF"
                strokeWidth={1}
              />
              <circle
                cx={p2[i].x}
                cy={p2[i].y}
                r={hoverIdx === i ? 3.5 : 2.2}
                fill="#14B8A6"
                stroke="#FFFFFF"
                strokeWidth={1}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center gap-4 text-[14px] text-[#667085]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#5B4FE9]" />
          {primaryLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#14B8A6]" />
          {secondaryLabel}
        </span>
      </div>
    </section>
  );
}
