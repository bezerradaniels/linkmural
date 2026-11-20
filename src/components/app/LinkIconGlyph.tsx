"use client";

import { brandColor, resolveIcon } from "@/lib/icons";

/** Renders a link icon ("si:<slug>" or "lm:<name>") inside the dashboard UI. */
export function LinkIconGlyph({
  iconRef,
  size = 18,
  monochrome = false,
}: {
  iconRef: string | null | undefined;
  size?: number;
  monochrome?: boolean;
}) {
  const icon = resolveIcon(iconRef);
  if (icon.type === "brand") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden
        focusable="false"
        style={{
          fill: monochrome ? "currentColor" : brandColor(icon, "brand"),
        }}
      >
        <path d={icon.path} />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icon.path} />
    </svg>
  );
}
