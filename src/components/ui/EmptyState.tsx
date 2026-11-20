import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

export type EmptyStateProps = {
  title: string;
  text?: ReactNode;
  icon?: IconName;
  /** The next step, usually one Button. */
  action?: ReactNode;
  className?: string;
};

/** Empty screen that teaches the next step. */
export function EmptyState({
  title,
  text,
  icon = "link",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center gap-3 px-6 py-8 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className={cx(
          "relative mb-1 grid size-[72px] place-items-center rounded-[22px] bg-ink text-lime",
          "after:absolute after:-top-2 after:-right-2 after:size-[22px] after:rounded-full after:border-4 after:border-paper after:bg-lime after:content-['']",
          "after:animate-pin-drop",
        )}
      >
        <Icon name={icon} size={28} />
      </div>
      <h2 className="m-0 font-display text-title leading-[26px] tracking-[-0.03em]">
        {title}
      </h2>
      {text && (
        <p className="m-0 max-w-[300px] text-[14px] leading-5 text-ink-muted">
          {text}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
