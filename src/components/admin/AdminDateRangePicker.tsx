"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type DatePresetKey =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "this_month"
  | "last_month"
  | "last_90d"
  | "custom";

type PresetOption = {
  key: Exclude<DatePresetKey, "custom">;
  label: string;
};

const PRESETS: PresetOption[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "last_7d", label: "Últimos 7 dias" },
  { key: "last_14d", label: "Últimos 14 dias" },
  { key: "last_30d", label: "Últimos 30 dias" },
  { key: "this_month", label: "Este mês" },
  { key: "last_month", label: "Mês passado" },
  { key: "last_90d", label: "Últimos 90 dias" },
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MONTHS_SHORT_PT = [
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  const check = new Date(Date.UTC(y, m, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function addDaysIso(iso: string, delta: number): string {
  const p = parseIsoDate(iso);
  if (!p) return iso;
  const dt = new Date(Date.UTC(p.y, p.m, p.d + delta));
  return toIsoDate(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

function computePresetRange(
  preset: Exclude<DatePresetKey, "custom">,
  todayIso: string,
): { from: string; to: string } {
  const p = parseIsoDate(todayIso) ?? { y: 2026, m: 10, d: 23 };
  switch (preset) {
    case "today":
      return { from: todayIso, to: todayIso };
    case "yesterday": {
      const yest = addDaysIso(todayIso, -1);
      return { from: yest, to: yest };
    }
    case "last_7d":
      return { from: addDaysIso(todayIso, -6), to: todayIso };
    case "last_14d":
      return { from: addDaysIso(todayIso, -13), to: todayIso };
    case "last_30d":
      return { from: addDaysIso(todayIso, -29), to: todayIso };
    case "this_month":
      return { from: toIsoDate(p.y, p.m, 1), to: todayIso };
    case "last_month": {
      const firstPrev = new Date(Date.UTC(p.y, p.m - 1, 1));
      const lastPrev = new Date(Date.UTC(p.y, p.m, 0));
      return {
        from: toIsoDate(
          firstPrev.getUTCFullYear(),
          firstPrev.getUTCMonth(),
          firstPrev.getUTCDate(),
        ),
        to: toIsoDate(
          lastPrev.getUTCFullYear(),
          lastPrev.getUTCMonth(),
          lastPrev.getUTCDate(),
        ),
      };
    }
    case "last_90d":
      return { from: addDaysIso(todayIso, -89), to: todayIso };
  }
}

function formatShortBr(iso: string): string {
  const p = parseIsoDate(iso);
  if (!p) return iso;
  return `${p.d} ${MONTHS_SHORT_PT[p.m]}`;
}

function formatInputBr(iso: string): string {
  const p = parseIsoDate(iso);
  if (!p) return iso;
  return `${pad2(p.d)}/${pad2(p.m + 1)}/${p.y}`;
}

function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const dt = new Date(Date.UTC(year, month + delta, 1));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() };
}

function buildMonthCells(
  year: number,
  month: number,
): ({ iso: string; day: number } | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: ({ iso: string; day: number } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIsoDate(year, month, d), day: d });
  }
  return cells;
}

export function AdminDateRangePicker({ todayIso }: { todayIso: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultRange = useMemo(
    () => computePresetRange("last_14d", todayIso),
    [todayIso],
  );

  // Active committed selection from URL
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");
  const urlPreset = searchParams.get("preset") as DatePresetKey | null;

  const committedFrom =
    urlFrom && parseIsoDate(urlFrom) ? urlFrom : defaultRange.from;
  const committedTo =
    urlTo && parseIsoDate(urlTo) ? urlTo : defaultRange.to;
  const committedPreset: DatePresetKey =
    urlPreset &&
    (urlPreset === "custom" || PRESETS.some((p) => p.key === urlPreset))
      ? urlPreset
      : "last_14d";

  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(committedFrom);
  const [draftTo, setDraftTo] = useState(committedTo);
  const [draftPreset, setDraftPreset] =
    useState<DatePresetKey>(committedPreset);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  // Right calendar shows the month of `to`; left shows the previous month
  const initialEndParts = parseIsoDate(committedTo) ?? {
    y: 2026,
    m: 10,
    d: 23,
  };
  const [rightMonth, setRightMonth] = useState<{ year: number; month: number }>(
    {
      year: initialEndParts.y,
      month: initialEndParts.m,
    },
  );

  const leftMonth = useMemo(
    () => addMonths(rightMonth.year, rightMonth.month, -1),
    [rightMonth],
  );

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleOpenToggle() {
    if (!open) {
      setDraftFrom(committedFrom);
      setDraftTo(committedTo);
      setDraftPreset(committedPreset);
      setSelectingEnd(false);
      setHoverIso(null);
      const endParts = parseIsoDate(committedTo);
      if (endParts) {
        setRightMonth({ year: endParts.y, month: endParts.m });
      }
    }
    setOpen((v) => !v);
  }

  function handlePresetSelect(key: Exclude<DatePresetKey, "custom">) {
    const range = computePresetRange(key, todayIso);
    setDraftPreset(key);
    setDraftFrom(range.from);
    setDraftTo(range.to);
    setSelectingEnd(false);
    setHoverIso(null);
    const endParts = parseIsoDate(range.to);
    if (endParts) {
      setRightMonth({ year: endParts.y, month: endParts.m });
    }
  }

  function handleDayClick(iso: string) {
    if (iso > todayIso) return;
    setDraftPreset("custom");
    if (!selectingEnd) {
      setDraftFrom(iso);
      setDraftTo(iso);
      setSelectingEnd(true);
    } else {
      if (iso < draftFrom) {
        setDraftTo(draftFrom);
        setDraftFrom(iso);
      } else {
        setDraftTo(iso);
      }
      setSelectingEnd(false);
      setHoverIso(null);
    }
  }

  function handleApply() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", draftFrom);
    params.set("to", draftTo);
    params.set("preset", draftPreset);
    setOpen(false);
    const targetPath = pathname === "/admin" ? "/admin" : "/admin";
    router.push(`${targetPath}?${params.toString()}`);
  }

  // Preview range while hovering during second click
  const previewFrom =
    selectingEnd && hoverIso && hoverIso < draftFrom ? hoverIso : draftFrom;
  const previewTo =
    selectingEnd && hoverIso
      ? hoverIso >= draftFrom
        ? hoverIso
        : draftFrom
      : draftTo;

  const activePresetLabel =
    PRESETS.find((p) => p.key === committedPreset)?.label ?? "Personalizado";
  const rangeSummary =
    committedFrom === committedTo
      ? formatShortBr(committedFrom)
      : `${formatShortBr(committedFrom)} – ${formatShortBr(committedTo)}`;

  const monthsToRender = [leftMonth, rightMonth];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={handleOpenToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 text-[12px] font-medium text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-colors hover:bg-[#F9FAFB]"
      >
        <svg
          viewBox="0 0 24 24"
          width={15}
          height={15}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-ink-muted"
        >
          <path d="M6 4.5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3zM8 2.5v4M16 2.5v4M3 10h18" />
        </svg>
        <span className="hidden sm:inline">
          <span className="font-semibold text-ink">{activePresetLabel}:</span>{" "}
          <span className="text-ink-soft">{rangeSummary}</span>
        </span>
        <span className="sm:hidden text-ink-soft">{rangeSummary}</span>
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Meta Ads Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Selecionar período de datas"
          className="animate-pop-in absolute top-full right-0 z-40 mt-2 w-[min(94vw,680px)] overflow-hidden rounded-[22px] border border-line bg-surface shadow-lg"
        >
          <div className="flex flex-col md:flex-row">
            {/* Left Presets Column */}
            <div className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-line bg-paper/60 p-3 md:w-44 md:flex-col md:overflow-visible md:border-r md:border-b-0">
              {PRESETS.map((preset) => {
                const selected = draftPreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset.key)}
                    className={`flex min-h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-caption font-medium transition-colors ${
                      selected
                        ? "bg-surface font-semibold text-ink shadow-sm"
                        : "text-ink-muted hover:bg-hover hover:text-ink"
                    }`}
                  >
                    <span
                      className={`inline-grid size-4 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-ink bg-lime"
                          : "border-line-strong bg-surface"
                      }`}
                    >
                      {selected && (
                        <span className="size-1.5 rounded-full bg-ink" />
                      )}
                    </span>
                    <span className="whitespace-nowrap">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Dual Calendar Column */}
            <div className="flex flex-1 flex-col justify-between p-4">
              {/* Calendar Navigation */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setRightMonth((cur) => addMonths(cur.year, cur.month, -1))
                  }
                  aria-label="Mês anterior"
                  className="inline-grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-paper text-ink hover:border-ink"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={14}
                    height={14}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                <div className="flex flex-1 items-center justify-around px-2 text-small font-semibold text-ink">
                  <span className="hidden sm:inline">
                    {MONTHS_PT[leftMonth.month]} {leftMonth.year}
                  </span>
                  <span>
                    {MONTHS_PT[rightMonth.month]} {rightMonth.year}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setRightMonth((cur) => addMonths(cur.year, cur.month, 1))
                  }
                  aria-label="Próximo mês"
                  className="inline-grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-paper text-ink hover:border-ink"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={14}
                    height={14}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>

              {/* Dual Month Grids (1 month on mobile, 2 on sm+) */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {monthsToRender.map((ym, idx) => {
                  const cells = buildMonthCells(ym.year, ym.month);
                  return (
                    <div
                      key={`${ym.year}-${ym.month}`}
                      className={idx === 0 ? "hidden sm:block" : "block"}
                    >
                      <div className="mb-1.5 grid grid-cols-7 text-center text-[11px] font-semibold text-ink-muted">
                        {WEEKDAYS.map((wd, i) => (
                          <span key={`${wd}-${i}`} className="py-1">
                            {wd}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-0.5 text-center">
                        {cells.map((cell, cellIdx) => {
                          if (!cell) {
                            return <span key={`empty-${cellIdx}`} />;
                          }
                          const isFuture = cell.iso > todayIso;
                          const isStart = cell.iso === previewFrom;
                          const isEnd = cell.iso === previewTo;
                          const isInRange =
                            cell.iso > previewFrom && cell.iso < previewTo;
                          const isToday = cell.iso === todayIso;

                          return (
                            <button
                              key={cell.iso}
                              type="button"
                              disabled={isFuture}
                              onClick={() => handleDayClick(cell.iso)}
                              onMouseEnter={() => {
                                if (selectingEnd && !isFuture) {
                                  setHoverIso(cell.iso);
                                }
                              }}
                              className={`relative h-8 w-full text-caption transition-colors ${
                                isFuture
                                  ? "cursor-not-allowed text-ink-muted/35"
                                  : "cursor-pointer"
                              } ${
                                isStart || isEnd
                                  ? "rounded-full bg-ink font-semibold text-paper"
                                  : isInRange
                                    ? "bg-lime-soft font-medium text-ink"
                                    : !isFuture
                                      ? "rounded-full text-ink hover:bg-hover"
                                      : ""
                              } ${
                                isToday && !isStart && !isEnd
                                  ? "ring-1 ring-inset ring-ink/40 rounded-full"
                                  : ""
                              }`}
                            >
                              {cell.day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer: Selected range display + Cancel / Update (Meta Ads style) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
                <div className="flex items-center gap-2 text-caption">
                  <span className="rounded-lg border border-line bg-paper px-2.5 py-1.5 font-medium text-ink">
                    {formatInputBr(draftFrom)}
                  </span>
                  <span className="text-ink-muted">–</span>
                  <span className="rounded-lg border border-line bg-paper px-2.5 py-1.5 font-medium text-ink">
                    {formatInputBr(draftTo)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-9 cursor-pointer items-center rounded-pill border border-line px-3.5 text-caption font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="inline-flex min-h-9 cursor-pointer items-center rounded-pill bg-lime px-4 text-caption font-semibold text-on-lime shadow-sm transition-colors hover:bg-lime-strong"
                  >
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
