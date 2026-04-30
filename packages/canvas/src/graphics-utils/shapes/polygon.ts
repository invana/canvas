import type { Graphics } from 'pixi.js';
import { type DrawStyle, resolveFillArg, resolveStrokeOpts } from '../types.js';
import { type DashStyle, drawDashedLine } from './dashed.js';

/**
 * Draw a regular polygon (triangle=3, diamond=4, pentagon=5, hexagon=6, …).
 * x,y = center. rotation in radians (default -PI/2 = point up).
 */
export function drawPolygon(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  sides: number,
  style: DrawStyle & { rotation?: number } = {},
): void {
  const { fill, fillAlpha = 1, stroke, rotation = -Math.PI / 2 } = style;

  const points = buildPolygonPoints(x, y, radius, sides, rotation);

  const fillArg = resolveFillArg(fill, fillAlpha);
  if (fillArg !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.poly(points).fill(fillArg as any);
  }
  if (stroke !== undefined) {
    g.poly(points).stroke(resolveStrokeOpts(style));
  }
}

/**
 * Draw dashes along a closed polyline (polygon or star outline).
 * `points` is a flat [x0,y0, x1,y1, …] array of vertices. The dash pattern
 * is carried across edges so it appears continuous.
 */
export function drawDashedPolyline(
  g: Graphics,
  points: number[],
  style: DashStyle = {},
): void {
  const dashLen = style.dashLength ?? 8;
  const gapLen = style.gapLength ?? 4;
  const pattern = dashLen + gapLen;
  let offset = style.offset ?? 0;
  const n = points.length / 2;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x1 = points[i * 2]!;
    const y1 = points[i * 2 + 1]!;
    const x2 = points[j * 2]!;
    const y2 = points[j * 2 + 1]!;
    const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    drawDashedLine(g, x1, y1, x2, y2, { ...style, offset });
    offset = (offset + segLen) % pattern;
  }
}

export type { DashStyle };

/**
 * Draw a free-form polyline / polygon from a flat `[x0,y0,x1,y1,...]` array.
 * Set `closed: true` to close the shape and apply a fill.
 */
export function drawPolyline(
  g: Graphics,
  points: ArrayLike<number>,
  style: DrawStyle & { closed?: boolean } = {},
): void {
  if (points.length < 4) return;
  const { fill, fillAlpha = 1, stroke, closed = true } = style;
  const pts: number[] = Array.from(points as ArrayLike<number>);

  const fillArg = closed ? resolveFillArg(fill, fillAlpha) : undefined;
  if (fillArg !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.poly(pts).fill(fillArg as any);
  }
  if (stroke !== undefined) {
    if (closed) {
      g.poly(pts).stroke(resolveStrokeOpts(style));
    } else {
      g.moveTo(pts[0]!, pts[1]!);
      for (let i = 2; i < pts.length; i += 2) {
        g.lineTo(pts[i]!, pts[i + 1]!);
      }
      g.stroke(resolveStrokeOpts(style));
    }
  }
}

/** Returns flat [x0,y0, x1,y1, …] array of polygon vertices. */
export function buildPolygonPoints(
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation = -Math.PI / 2,
): number[] {
  const points: number[] = [];
  const step = (Math.PI * 2) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * step + rotation;
    points.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  return points;
}
