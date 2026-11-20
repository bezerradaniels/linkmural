"use client";

import { useState } from "react";
import { cx } from "./cx";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  className?: string;
};

/** Single choice between 2–4 options. */
export function Segmented<T extends string>({
  options,
  value,
  defaultValue,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  const [internal, setInternal] = useState<T | undefined>(
    defaultValue ?? options[0]?.value,
  );
  const current = value ?? internal;

  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        "inline-flex gap-0.5 rounded-pill bg-hover p-[3px]",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (value === undefined) setInternal(option.value);
              onChange?.(option.value);
            }}
            className={cx(
              "h-[34px] cursor-pointer rounded-pill px-4 text-small font-medium text-ink-muted",
              "transition-[background-color,color] duration-(--duration-base) ease-out hover:text-ink",
              "aria-pressed:bg-surface aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
