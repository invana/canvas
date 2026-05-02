// ── flatten.ts ────────────────────────────────────────────────────────────────
// Flatten Bezier / quadratic curves into polylines for boundary intersection.
//
// Uses adaptive subdivision: a curve segment is recursively split until the
// straight line between its endpoints is within `tolerance` pixels of the
// curve's mid-control hull. Output is a `Float32Array` of interleaved x/y
// coordinates, suitable for `rayVsPolyline`.

import type { PathCommand } from '../../drawing/DrawContext.js';

const DEFAULT_TOL = 0.5;

/**
 * Flatten a single cubic Bezier `(p0, cp1, cp2, p1)` into a polyline.
 * The first and last points of the result are exactly `p0` and `p1`.
 */
export function flattenCubic(
  p0x: number, p0y: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  p1x: number, p1y: number,
  tolerance = DEFAULT_TOL,
): Float32Array {
  const out: number[] = [p0x, p0y];
  _subdivCubic(p0x, p0y, cp1x, cp1y, cp2x, cp2y, p1x, p1y, tolerance * tolerance, out, 0);
  out.push(p1x, p1y);
  return Float32Array.from(out);
}

function _subdivCubic(
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number,
  tolSq: number, out: number[], depth: number,
): void {
  if (depth > 18) return;
  // Distance² from cp1, cp2 to the chord (p0 → p3). When both are close, the
  // segment is flat enough to emit as a line.
  const d1 = _distSqPointLine(x1, y1, x0, y0, x3, y3);
  const d2 = _distSqPointLine(x2, y2, x0, y0, x3, y3);
  if (d1 <= tolSq && d2 <= tolSq) return;

  // De Casteljau split at t = 0.5.
  const m01x = (x0 + x1) * 0.5, m01y = (y0 + y1) * 0.5;
  const m12x = (x1 + x2) * 0.5, m12y = (y1 + y2) * 0.5;
  const m23x = (x2 + x3) * 0.5, m23y = (y2 + y3) * 0.5;
  const m012x = (m01x + m12x) * 0.5, m012y = (m01y + m12y) * 0.5;
  const m123x = (m12x + m23x) * 0.5, m123y = (m12y + m23y) * 0.5;
  const mx = (m012x + m123x) * 0.5,  my = (m012y + m123y) * 0.5;

  _subdivCubic(x0, y0, m01x, m01y, m012x, m012y, mx, my, tolSq, out, depth + 1);
  out.push(mx, my);
  _subdivCubic(mx, my, m123x, m123y, m23x, m23y, x3, y3, tolSq, out, depth + 1);
}

/**
 * Flatten a single quadratic Bezier `(p0, cp, p1)` into a polyline.
 */
export function flattenQuadratic(
  p0x: number, p0y: number,
  cpx: number, cpy: number,
  p1x: number, p1y: number,
  tolerance = DEFAULT_TOL,
): Float32Array {
  const out: number[] = [p0x, p0y];
  _subdivQuad(p0x, p0y, cpx, cpy, p1x, p1y, tolerance * tolerance, out, 0);
  out.push(p1x, p1y);
  return Float32Array.from(out);
}

function _subdivQuad(
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number,
  tolSq: number, out: number[], depth: number,
): void {
  if (depth > 18) return;
  const d = _distSqPointLine(x1, y1, x0, y0, x2, y2);
  if (d <= tolSq) return;

  const m01x = (x0 + x1) * 0.5, m01y = (y0 + y1) * 0.5;
  const m12x = (x1 + x2) * 0.5, m12y = (y1 + y2) * 0.5;
  const mx = (m01x + m12x) * 0.5, my = (m01y + m12y) * 0.5;

  _subdivQuad(x0, y0, m01x, m01y, mx, my, tolSq, out, depth + 1);
  out.push(mx, my);
  _subdivQuad(mx, my, m12x, m12y, x2, y2, tolSq, out, depth + 1);
}

/**
 * Flatten an entire {@link PathCommand} array into a single polyline.
 *
 * `M` (move-to) breaks the polyline; the result is a flat coordinate array
 * representing the **last contiguous run**. For typical closed-shape paths
 * authored as `M ... L|C|Q ... Z` this is the perimeter polyline.
 *
 * `Z` is treated as an explicit "close" — the last point of the run is forced
 * back to the most recent `M`.
 */
export function flattenPath(
  cmds: ReadonlyArray<PathCommand>,
  tolerance = DEFAULT_TOL,
): Float32Array {
  const out: number[] = [];
  let cx = 0, cy = 0;
  let mx = 0, my = 0;
  for (const c of cmds) {
    switch (c.cmd) {
      case 'M':
        out.length = 0;          // start a fresh run on every M
        out.push(c.x, c.y);
        cx = mx = c.x;
        cy = my = c.y;
        break;
      case 'L':
        out.push(c.x, c.y);
        cx = c.x; cy = c.y;
        break;
      case 'Q': {
        const seg = flattenQuadratic(cx, cy, c.cpx, c.cpy, c.x, c.y, tolerance);
        for (let i = 2; i < seg.length; i++) out.push(seg[i] as number);
        cx = c.x; cy = c.y;
        break;
      }
      case 'C': {
        const seg = flattenCubic(cx, cy, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y, tolerance);
        for (let i = 2; i < seg.length; i++) out.push(seg[i] as number);
        cx = c.x; cy = c.y;
        break;
      }
      case 'Z':
        if (out.length >= 2 && (cx !== mx || cy !== my)) {
          out.push(mx, my);
          cx = mx; cy = my;
        }
        break;
    }
  }
  return Float32Array.from(out);
}

/** Squared perpendicular distance from (px, py) to the infinite line through (a, b). */
function _distSqPointLine(
  px: number, py: number,
  ax: number, ay: number, bx: number, by: number,
): number {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) {
    const ex = px - ax, ey = py - ay;
    return ex * ex + ey * ey;
  }
  const cross = (px - ax) * dy - (py - ay) * dx;
  return (cross * cross) / lenSq;
}
