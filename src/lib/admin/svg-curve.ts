export type SvgPoint = { x: number; y: number };

/**
 * Builds a smooth, monotonic cubic Bezier SVG path between points.
 * Horizontal control tangents guarantee the curve never overshoots below 0.
 */
export function buildSmoothLinePath(points: SvgPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  }

  const parts = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = ((prev.x + curr.x) / 2).toFixed(1);
    parts.push(
      `C ${cx} ${prev.y.toFixed(1)}, ${cx} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`,
    );
  }
  return parts.join(" ");
}
