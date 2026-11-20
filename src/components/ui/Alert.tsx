import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

export type AlertTone = "info" | "success" | "warning" | "error";

const tones: Record<AlertTone, { box: string; icon: string; name: IconName }> =
  {
    info: { box: "bg-lime-soft", icon: "text-ink", name: "info" },
    success: { box: "bg-positive-soft", icon: "text-positive", name: "check" },
    warning: { box: "bg-warning-soft", icon: "text-warning", name: "warning" },
    error: { box: "bg-negative-soft", icon: "text-negative", name: "warning" },
  };

export type AlertProps = {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  /** Optional call to action, e.g. a "Ver planos" button. */
  action?: ReactNode;
  className?: string;
};

/** Persistent message tied to a context: plan limit, billing, save error. */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: AlertProps) {
  const t = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-lg px-4 py-3.5 text-[14px] leading-5 text-ink",
        t.box,
        className,
      )}
    >
      <Icon name={t.name} className={cx("shrink-0", t.icon)} />
      <div className="min-w-0 flex-1">
        <strong className="block font-semibold">{title}</strong>
        {children && <div>{children}</div>}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  );
}
