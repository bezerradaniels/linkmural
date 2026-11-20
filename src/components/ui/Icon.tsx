import type { SVGProps } from "react";
import { ICON_PATHS, type IconName } from "./icons";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string;
};

export function Icon({
  name,
  size = 20,
  label,
  strokeWidth = 1.8,
  ...rest
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
