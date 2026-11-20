import { cx } from "./cx";

export function clampPercent(value: number, max = 100) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export type ProgressProps = {
  value: number;
  max?: number;
  /** Accessible name, e.g. "Links usados". */
  label: string;
  tone?: "default" | "warning";
  className?: string;
};

/** Bar for plan usage and similar. */
export function Progress({
  value,
  max = 100,
  label,
  tone = "default",
  className,
}: ProgressProps) {
  const pct = clampPercent(value, max);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx("h-1.5 overflow-hidden rounded-pill bg-hover", className)}
    >
      <span
        className={cx(
          "block h-full rounded-[inherit] transition-[width] duration-(--duration-slow) ease-out",
          tone === "warning" ? "bg-warning" : "bg-ink",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Onboarding steps: done in ink, current in lime. `current` is 1-based. */
export function Steps({
  total,
  current,
  className,
}: {
  total: number;
  current: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={`Passo ${current} de ${total}`}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className={cx("flex gap-1.5", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-1 flex-1 rounded-pill",
            i + 1 < current && "bg-ink",
            i + 1 === current && "bg-lime",
            i + 1 > current && "bg-hover",
          )}
        />
      ))}
    </div>
  );
}
