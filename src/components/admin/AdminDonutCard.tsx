"use client";

import { useState } from "react";

export type DonutSegment = {
  label: string;
  value: number;
  displayValue: string;
  pct: number;
  color: string;
};

export type DonutSlide = {
  title: string;
  subtitle: string;
  centerValue: string;
  centerLabel: string;
  segments: DonutSegment[];
};

export function AdminDonutCard({ slides }: { slides: DonutSlide[] }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const slide = slides[slideIdx] ?? slides[0];
  if (!slide) return null;

  const total = slide.segments.reduce((acc, s) => acc + s.value, 0);
  const size = 204;
  const strokeWidth = 22;
  const radius = (size - strokeWidth - 10) / 2;
  const circumference = 2 * Math.PI * radius;

  // Rounded-cap segmented arcs with clean breathing space
  const nonZeroCount = slide.segments.filter((s) => s.value > 0).length;
  const gapPx = nonZeroCount > 1 ? strokeWidth + 6 : 0;

  const arcs = slide.segments.reduce<
    {
      seg: DonutSegment;
      i: number;
      dashLen: number;
      offset: number;
      nextOffset: number;
    }[]
  >((acc, seg, i) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const rawLen = fraction * circumference;
    const dashLen = rawLen > 0 ? Math.max(4, rawLen - gapPx) : 0;
    const prevOffset = i === 0 ? 0 : acc[i - 1].nextOffset;
    acc.push({
      seg,
      i,
      dashLen,
      offset: -(prevOffset + gapPx / 2),
      nextOffset: prevOffset + rawLen,
    });
    return acc;
  }, []);

  const hovered = hoveredIdx !== null ? slide.segments[hoveredIdx] : null;

  function prevSlide() {
    setHoveredIdx(null);
    setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
  }

  function nextSlide() {
    setHoveredIdx(null);
    setSlideIdx((i) => (i + 1) % slides.length);
  }

  return (
    <section
      style={{ animationDelay: "180ms" }}
      className="animate-rise flex flex-col gap-4 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      {/* Header with < Title > switcher */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Categoria anterior"
          className="inline-grid size-9 cursor-pointer place-items-center rounded-full border border-transparent text-ink-muted transition-all hover:border-line hover:bg-paper hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
            {slide.title}
          </h2>
          <p className="text-caption text-ink-muted">{slide.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Próxima categoria"
          className="inline-grid size-9 cursor-pointer place-items-center rounded-full border border-transparent text-ink-muted transition-all hover:border-line hover:bg-paper hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* Modern Rounded-Cap Donut Ring */}
      <div className="relative mx-auto grid place-items-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 overflow-visible"
          role="img"
          aria-label={`${slide.title}: ${slide.centerValue} ${slide.centerLabel}`}
        >
          {/* Soft recessed track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--paper)"
            strokeWidth={strokeWidth}
          />

          {/* Rounded-cap segments */}
          {arcs.map(({ seg, i, dashLen, offset }) => {
            if (dashLen <= 0) return null;
            const isActive = hoveredIdx === i;
            return (
              <circle
                key={`${slideIdx}-${seg.label}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLen} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{
                  opacity:
                    hoveredIdx === null || hoveredIdx === i ? 1 : 0.35,
                  filter: isActive
                    ? `drop-shadow(0 0 6px ${seg.color})`
                    : undefined,
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center focal badge */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="font-display text-display-md leading-none tracking-[-0.03em] text-ink transition-all duration-200">
            {hovered ? hovered.displayValue : slide.centerValue}
          </span>
          <span className="mt-1.5 rounded-pill bg-paper px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
            {hovered ? `${hovered.label} · ${hovered.pct}%` : slide.centerLabel}
          </span>
        </div>
      </div>

      {/* Modern 2x2 Pill Legend Cards */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {slide.segments.map((seg, i) => {
          const isActive = hoveredIdx === i;
          return (
            <div
              key={seg.label}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex cursor-default flex-col gap-1.5 rounded-2xl border p-2.5 transition-all duration-200 ${
                isActive
                  ? "border-line-strong bg-paper shadow-sm"
                  : "border-line/60 bg-paper/45 hover:border-line"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: seg.color }}
                  />
                  <span className="truncate text-caption font-medium text-ink-soft">
                    {seg.label}
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-ink-muted">
                  {seg.pct}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-small font-semibold text-ink">
                  {seg.displayValue}
                </span>
                <div className="h-1.5 w-12 overflow-hidden rounded-pill bg-surface">
                  <div
                    className="h-full rounded-pill transition-all duration-300"
                    style={{
                      width: `${Math.max(seg.value > 0 ? 8 : 0, seg.pct)}%`,
                      background: seg.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide indicator dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {slides.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => {
                setHoveredIdx(null);
                setSlideIdx(idx);
              }}
              aria-label={`Ver ${s.title}`}
              className={`h-1.5 cursor-pointer rounded-pill transition-all duration-200 ${
                idx === slideIdx
                  ? "w-5 bg-ink"
                  : "w-1.5 bg-line-strong hover:bg-ink-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
