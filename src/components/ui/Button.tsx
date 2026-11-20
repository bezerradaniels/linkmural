import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill border font-sans font-semibold leading-none no-underline " +
  "transition-[background-color,border-color,transform,box-shadow] duration-(--duration-fast) ease-out " +
  "enabled:hover:-translate-y-px enabled:active:translate-y-0 enabled:active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 " +
  "[&_svg]:size-[18px] cursor-pointer";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-lime text-on-lime enabled:hover:bg-lime-strong enabled:hover:shadow-md",
  secondary: "border-transparent bg-ink text-paper enabled:hover:bg-ink-soft",
  outline:
    "border-line-strong bg-transparent text-ink enabled:hover:border-ink enabled:hover:bg-surface",
  ghost: "border-transparent bg-transparent text-ink enabled:hover:bg-hover",
  danger: "border-transparent bg-negative text-on-negative",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-6.5 text-base",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "size-8 px-0",
  md: "size-11 px-0",
  lg: "size-13 px-0",
};

/** Classes for a button look-alike (e.g. a Next <Link>). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  iconOnly = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
} = {}) {
  return cx(
    base,
    variants[variant],
    iconOnly ? iconSizes[size] : sizes[size],
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square icon button. Requires aria-label. */
  iconOnly?: boolean;
  /** Shows a spinner and blocks clicks. Use a gerund label ("Publicando…"). */
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

export function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, iconOnly, className })}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
