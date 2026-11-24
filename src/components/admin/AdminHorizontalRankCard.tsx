"use client";

import { useState } from "react";
import type { HorizontalRankDatum } from "@/lib/admin/dashboard-data";

export function AdminHorizontalRankCard({
  devices,
  sources,
  totalViews,
}: {
  devices: HorizontalRankDatum[];
  sources: HorizontalRankDatum[];
  totalViews: number;
}) {
  const [tab, setTab] = useState<"devices" | "sources">("devices");
  const rows = tab === "devices" ? devices : sources;

  return (
    <section className="flex flex-col justify-between rounded-[10px] border border-[#EAECF0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-[#101828]">
            {tab === "devices" ? "Dispositivos" : "Origens de cadastro"}
          </h2>

          <div className="inline-flex rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-0.5 text-[13px]">
            <button
              type="button"
              onClick={() => setTab("devices")}
              className={`inline-flex h-5 cursor-pointer items-center rounded-md px-2 leading-none font-medium transition-colors ${
                tab === "devices"
                  ? "bg-white text-[#101828] shadow-xs"
                  : "text-[#667085] hover:text-[#101828]"
              }`}
            >
              Aparelhos
            </button>
            <button
              type="button"
              onClick={() => setTab("sources")}
              className={`inline-flex h-5 cursor-pointer items-center rounded-md px-2 leading-none font-medium transition-colors ${
                tab === "sources"
                  ? "bg-white text-[#101828] shadow-xs"
                  : "text-[#667085] hover:text-[#101828]"
              }`}
            >
              Origens
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-2">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-[15px] text-[#98A2B3]">
              Sem registros neste período.
            </p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[112px_1fr_50px] items-center gap-3"
              >
                <span className="truncate text-[15px] font-medium text-[#344054]">
                  {row.label}
                </span>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F2F4F7]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(4, Math.min(100, row.pct))}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
                <span className="text-right text-[15px] font-semibold text-[#667085] tabular-nums">
                  {row.pct.toFixed(1)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="mt-3 text-[14px] text-[#98A2B3]">
        Baseado em {totalViews.toLocaleString("pt-BR")} visualizações no período
      </p>
    </section>
  );
}
