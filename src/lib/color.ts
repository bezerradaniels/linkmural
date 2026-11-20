/** Small color helpers for theme building (WCAG contrast, mixing). */

export function isHex(value: unknown): value is string {
  return (
    typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  );
}

function toRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(rgb: number[]): string {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}

/** Linear mix: t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t));
}

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Of the candidates, the one with the highest contrast against `bg`. */
export function bestOn(bg: string, candidates: string[]): string {
  return candidates.reduce((best, c) =>
    contrast(c, bg) > contrast(best, bg) ? c : best,
  );
}

/**
 * Moves `fg` toward `target` until it reaches `min` contrast against every
 * background in `bgs` (or becomes `target`).
 */
export function ensureContrast(
  fg: string,
  bgs: string[],
  target: string,
  min = 4.5,
): string {
  const ok = (c: string) => bgs.every((bg) => contrast(c, bg) >= min);
  if (ok(fg)) return fg;
  for (let t = 0.1; t < 1; t += 0.1) {
    const candidate = mix(fg, target, t);
    if (ok(candidate)) return candidate;
  }
  return target;
}
