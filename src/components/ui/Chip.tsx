import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

/** Toggleable filter or choice (onboarding link picks, filters). */
export function Chip({
  selected = false,
  className,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border border-line-strong bg-surface px-3.5 text-small font-medium text-ink",
        "transition-[background-color,border-color] duration-(--duration-fast) ease-out hover:border-ink [&_svg]:size-4",
        "aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...rest}
    />
  );
}
