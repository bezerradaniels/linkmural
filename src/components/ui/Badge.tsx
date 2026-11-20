import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export type BadgeVariant = "neutral" | "pro" | "business" | "outline";
export type DotTone = "positive" | "warning" | "negative" | "off";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-hover text-ink",
  pro: "bg-lime text-on-lime",
  business: "bg-ink text-paper",
  outline:
    "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]",
};

const dotTones: Record<DotTone, string> = {
  positive: "bg-positive",
  warning: "bg-warning",
  negative: "bg-negative",
  off: "bg-ink-muted",
};

/** Small colored status dot. `live` adds a pulse. */
export function Dot({
  tone = "positive",
  live = false,
}: {
  tone?: DotTone;
  live?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative size-2 shrink-0 rounded-full",
        dotTones[tone],
        live &&
          "after:absolute after:inset-0 after:animate-pulse-dot after:rounded-full after:bg-inherit after:content-['']",
      )}
    />
  );
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  dot?: DotTone;
  live?: boolean;
};

/** Plan (Grátis, Pro, Negócios) or status label. */
export function Badge({
  variant = "neutral",
  dot,
  live,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center gap-1.5 rounded-[6px] px-2 text-caption font-semibold whitespace-nowrap",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {dot && <Dot tone={dot} live={live} />}
      {children}
    </span>
  );
}
