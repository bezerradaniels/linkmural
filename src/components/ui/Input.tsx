"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "prefix"
> & {
  label: string;
  /** Help text under the field. */
  help?: ReactNode;
  /** Error message. Sets aria-invalid and replaces the help text. */
  error?: ReactNode;
  /** Success message (e.g. "Endereço livre"). */
  success?: ReactNode;
  /** Fixed text before the value, e.g. "linkmural.com/". */
  prefix?: string;
  ref?: React.Ref<HTMLInputElement>;
};

const field =
  "h-11 w-full min-w-0 rounded-md border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-muted " +
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out hover:border-ink-muted " +
  "focus:border-ink focus:shadow-[0_0_0_3px_var(--lime)] focus:outline-none " +
  "aria-invalid:border-negative disabled:cursor-not-allowed disabled:bg-hover disabled:text-ink-muted";

export function Input({
  label,
  help,
  error,
  success,
  prefix,
  id,
  className,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? success ?? help;
  const tone = error ? "error" : success ? "ok" : "help";

  const input = (
    <input
      id={inputId}
      aria-invalid={error ? true : undefined}
      aria-describedby={message ? messageId : undefined}
      className={cx(
        field,
        prefix &&
          "border-0 pl-0 shadow-none hover:border-0 focus:border-0 focus:shadow-none",
      )}
      {...rest}
    />
  );

  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-small font-semibold">
        {label}
      </label>
      {prefix ? (
        <div
          className={cx(
            "flex items-stretch overflow-hidden rounded-md border border-line-strong bg-surface",
            "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out",
            "focus-within:border-ink focus-within:shadow-[0_0_0_3px_var(--lime)]",
            !!error && "border-negative",
          )}
        >
          <span className="flex items-center pr-1 pl-3.5 text-[15px] text-ink-muted select-none">
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
      {message && (
        <p
          id={messageId}
          className={cx(
            "flex items-center gap-1.5 text-[12.5px] leading-[18px]",
            tone === "error" && "text-negative",
            tone === "ok" && "text-positive",
            tone === "help" && "text-ink-muted",
          )}
        >
          {tone === "error" && <Icon name="warning" size={14} />}
          {tone === "ok" && <Icon name="check" size={14} />}
          {message}
        </p>
      )}
    </div>
  );
}
