/**
 * Internal polygon helpers shared by `polygon`, `arrow`, and `star` primitives.
 */

import type { Graphics } from 'pixi.js';
import type { Point } from '../types';

/**
 * Emit a closed polygon path into the supplied Graphics, optionally filleting
 * each vertex with arcs of the given radius. Per-vertex radius is auto-capped
 * to half the shorter adjacent edge so short edges never overshoot.
 *
 * `radius <= 0` falls back to `g.poly(points)` (sharp corners).
 */
export function drawRoundedPoly(
  g: Graphics,
  points: ReadonlyArray<Point>,
  radius: number,
): void {
  if (points.length < 3) return;
  if (radius <= 0) {
    g.poly(points as { x: number; y: number }[]);
    return;
  }

  const n = points.length;
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const start = mid(points[0]!, points[1]!);
  g.moveTo(start.x, start.y);
  for (let i = 1; i <= n; i++) {
    const prev = points[(i - 1 + n) % n]!;
    const v = points[i % n]!;
    const next = points[(i + 1) % n]!;
    const cap = Math.min(radius, 0.5 * dist(prev, v), 0.5 * dist(v, next));
    g.arcTo(v.x, v.y, next.x, next.y, cap);
  }
  g.closePath();
}
