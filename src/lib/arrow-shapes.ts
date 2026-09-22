import type { ArrowStyle } from "@/types";

export interface Point {
  x: number;
  y: number;
}

/**
 * Generates the path points for an arrow between two normalized (0-1)
 * points, in the given style. Shared between the Konva editor (which draws
 * a line through the points with an arrowhead at the last one) and the
 * public storefront's plain-SVG rendering.
 */
export function buildArrowPoints(style: ArrowStyle, start: Point, end: Point): Point[] {
  if (style === "straight") return [start, end];

  if (style === "curved") {
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 0.0001;
    // Perpendicular offset, scaled to the arrow's own length so it reads
    // well at any size.
    const nx = -dy / len;
    const ny = dx / len;
    const bend = len * 0.35;
    const cx = mx + nx * bend;
    const cy = my + ny * bend;

    const steps = 24;
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * cx + t * t * end.x;
      const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * cy + t * t * end.y;
      points.push({ x, y });
    }
    return points;
  }

  // spiral: winds inward from `start`, tightening down to `end` — like a
  // hand-drawn curl pointing at its target.
  const dx = start.x - end.x;
  const dy = start.y - end.y;
  const scale = Math.hypot(dx, dy) || 0.0001;
  const theta0 = Math.atan2(dy, dx);
  const turns = 2.2;
  const steps = 60;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const radius = 1 - t;
    const angle = t * turns * 2 * Math.PI;
    const lx = radius * Math.cos(angle);
    const ly = radius * Math.sin(angle);
    const wx = end.x + scale * (lx * Math.cos(theta0) - ly * Math.sin(theta0));
    const wy = end.y + scale * (lx * Math.sin(theta0) + ly * Math.cos(theta0));
    points.push({ x: wx, y: wy });
  }
  return points;
}

/** Flattened [x1,y1,x2,y2,...] array in normalized units, for Konva's Arrow `points` prop. */
export function toFlatPoints(points: Point[]): number[] {
  return points.flatMap((p) => [p.x, p.y]);
}

/** SVG path `d` attribute (normalized 0-1 coordinate space) for the plain-SVG storefront rendering. */
export function toSvgPath(points: Point[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}
