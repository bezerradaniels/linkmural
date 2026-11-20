import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type ControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Visible text. The whole row is clickable (44px tall). */
  label: ReactNode;
  ref?: React.Ref<HTMLInputElement>;
};

const row =
  "inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] has-disabled:cursor-not-allowed has-disabled:opacity-45";
const box =
  "m-0 shrink-0 cursor-pointer appearance-none disabled:cursor-not-allowed";

/** Turns something on or off immediately, without a Save button. */
export function Switch({ label, className, ...rest }: ControlProps) {
  return (
    <label className={cx(row, className)}>
      <input
        type="checkbox"
        role="switch"
        className={cx(
          box,
          "relative h-[26px] w-11 rounded-pill bg-line-strong transition-colors duration-(--duration-base) ease-out checked:bg-ink",
          "after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-surface after:shadow-sm after:content-['']",
          "after:transition-[transform,background-color] after:duration-(--duration-base) after:ease-pin",
          "checked:after:translate-x-[18px] checked:after:bg-lime",
        )}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

/** Multiple choice or acceptance. */
export function Checkbox({ label, className, ...rest }: ControlProps) {
  return (
    <label className={cx(row, className)}>
      <input
        type="checkbox"
        className={cx(
          box,
          "inline-grid size-5 place-content-center rounded-[6px] border-[1.5px] border-line-strong bg-surface",
          "transition-[background-color,border-color] duration-(--duration-fast) ease-out checked:border-ink checked:bg-ink",
          "before:h-[5px] before:w-[9px] before:border-b-2 before:border-l-2 before:border-lime before:opacity-0 before:content-['']",
          "before:translate-x-px before:-translate-y-px before:scale-40 before:-rotate-45",
          "before:transition-[transform,opacity] before:duration-(--duration-base) before:ease-pin",
          "checked:before:scale-100 checked:before:opacity-100",
        )}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

/** One choice among a few options. Group radios with the same name. */
export function Radio({ label, className, ...rest }: ControlProps) {
  return (
    <label className={cx(row, className)}>
      <input
        type="radio"
        className={cx(
          box,
          "size-5 rounded-full border-[1.5px] border-line-strong bg-surface",
          "transition-[border-color,border-width] duration-(--duration-fast) ease-out checked:border-[6px] checked:border-ink",
        )}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}
