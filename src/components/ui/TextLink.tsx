import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "./cx";

/** Inline link with a lime highlighter that fills on hover. */
export function TextLink({ className, ...rest }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cx(
        "rounded-[4px] bg-[linear-gradient(var(--lime),var(--lime))] bg-[length:100%_2px] bg-bottom-left bg-no-repeat px-0.5 font-medium text-ink no-underline",
        "transition-[background-size] duration-(--duration-base) ease-out hover:bg-[length:100%_100%]",
        className,
      )}
      {...rest}
    />
  );
}
