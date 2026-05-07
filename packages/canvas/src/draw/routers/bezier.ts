/**
 * `bezier` router — samples a cubic Bezier into a polyline.
 *
 * If the endpoints carry tangents the router uses them directly; otherwise it
 * synthesises horizontal control vectors with magnitude proportional to the
 * endpoint distance (a sensible default for left-to-right diagram layouts).
 *
 * `opts.samples` controls polyline resolution. Default `16`. The returned
 * polyline includes both endpoints. Layers reading the polyline for tangent
 * calculation (e.g. to orient a marker shape at an endpoint) get a faithful
 * tangent from the last segment direction.
 */

import type { Point, Router, Vec2 } from '../types';

const DEFAULT_SAMPLES = 16;

export const bezierRouter: Router = (a, b, opts) => {
  const samples = (opts?.samples as number) ?? DEFAULT_SAMPLES;
  const handle = handleLength(a, b);
  const c1 = applyTangent(a, a.tangent, handle);
  const c2 = applyTangent(b, b.tangent, -handle);

  const out: Point[] = new Array(samples + 1);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    out[i] = cubic(a, c1, c2, b, t);
  }
  return out;
};

function handleLength(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // 1/3 of endpoint distance is the common heuristic for "natural" curvature.
  return Math.hypot(dx, dy) / 3;
}

function applyTangent(p: Point, tangent: Vec2 | undefined, length: number): Point {
  if (tangent) {
    return { x: p.x + tangent.x * length, y: p.y + tangent.y * length };
  }
  return { x: p.x + length, y: p.y };
}

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}
