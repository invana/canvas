/**
 * Shared polyline + polygon geometry utilities for decorations.
 *
 * - `offsetPolygon` / `expandPolyline` produce shape-following outlines for
 *   shape decorations (halo, border, marching-ants, pulse-ring, breathing)
 *   when a host outline polyline is supplied.
 * - `polyToShape` traces a closed polygon path on a Graphics; caller fills /
 *   strokes after.
 * - `drawDashedPolylineClosed` stamps a dashed outline around a closed
 *   polyline (shape marching-ants).
 * - `drawDashedPolylineOpen` stamps dashes along an open polyline
 *   (connector marching-ants).
 *
 * All functions are pure with respect to inputs aside from `g.*` mutations.
 * Internal to the `draw/` module — leading underscore signals "not part of
 * the public draw API surface."
 */

import type { Graphics } from 'pixi.js';
import type { Point } from '../types';

type Pt = { readonly x: number; readonly y: number };

/**
 * Offset (expand or contract) a closed polygon by moving each edge outward by
 * `delta` pixels along its outward normal, then computing new vertex positions
 * as the intersection of adjacent offset edges.
 *
 * Produces a true "parallel offset" where every edge is exactly `delta` px
 * from the original — unlike centroid-based expansion, which produces uneven
 * offsets between edges and corners. Works correctly for convex polygons in
 * either winding (CW or CCW). For concave polygons the result may
 * self-intersect near re-entrant corners.
 */
export function offsetPolygon(pts: ReadonlyArray<Pt>, delta: number): Pt[] {
  if (pts.length === 0) return [];
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open: Pt[] =
    first.x === last.x && first.y === last.y
      ? (pts.slice(0, -1) as Pt[])
      : ([...pts] as Pt[]);
  const n = open.length;
  if (n < 3) return [];

  // Signed area via shoelace — positive = CCW, negative = CW.
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = open[i]!;
    const b = open[(i + 1) % n]!;
    area += a.x * b.y - b.x * a.y;
  }
  const sign = area >= 0 ? 1 : -1;

  const edgeNormals: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = open[i]!;
    const b = open[(i + 1) % n]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    edgeNormals.push(
      len > 1e-10
        ? { x: (sign * dy) / len, y: -(sign * dx) / len }
        : { x: 0, y: 0 },
    );
  }

  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const prevEdge = (i - 1 + n) % n;
    const nj = edgeNormals[prevEdge]!;
    const ni = edgeNormals[i]!;
    const v = open[i]!;

    const p1 = { x: v.x + delta * nj.x, y: v.y + delta * nj.y };
    const prevV = open[prevEdge]!;
    const d1 = { x: v.x - prevV.x, y: v.y - prevV.y };

    const p2 = { x: v.x + delta * ni.x, y: v.y + delta * ni.y };
    const nextV = open[(i + 1) % n]!;
    const d2 = { x: nextV.x - v.x, y: nextV.y - v.y };

    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < 1e-10) {
      result.push({ x: v.x + delta * ni.x, y: v.y + delta * ni.y });
    } else {
      const ex = p2.x - p1.x;
      const ey = p2.y - p1.y;
      const t = (ex * d2.y - ey * d2.x) / cross;
      result.push({ x: p1.x + t * d1.x, y: p1.y + t * d1.y });
    }
  }

  if (result.length > 0) result.push({ ...result[0]! });
  return result;
}

/**
 * Expand (or contract when `delta` < 0) each vertex of a closed polyline
 * radially from the centroid. Works well for convex polygons; for concave
 * shapes the expansion may produce artefacts near re-entrant corners.
 */
export function expandPolyline(pts: ReadonlyArray<Pt>, delta: number): Pt[] {
  if (pts.length === 0) return [];
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open = first.x === last.x && first.y === last.y ? pts.slice(0, -1) : pts;
  const cx = open.reduce((s, p) => s + p.x, 0) / open.length;
  const cy = open.reduce((s, p) => s + p.y, 0) / open.length;
  return pts.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: p.x, y: p.y };
    return { x: p.x + (dx / len) * delta, y: p.y + (dy / len) * delta };
  });
}

/**
 * Trace a closed polygon path onto `g`. Strips the duplicate closing point if
 * present so Pixi's auto-close doesn't produce a doubled vertex. Caller emits
 * `g.fill()` / `g.stroke()` after.
 */
export function polyToShape(g: Graphics, pts: ReadonlyArray<Pt>): void {
  if (pts.length < 3) return;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open =
    first.x === last.x && first.y === last.y ? pts.slice(0, -1) : pts;
  g.poly(open as Point[]);
}

/**
 * Stamp dashed segments along a CLOSED polyline (last point === first). Each
 * dash is emitted as one self-contained sub-path. Seam-wrapped dashes emit
 * two connected arcs joined at `poly[0]` so Pixi never produces doubled
 * butt-caps.
 *
 * Caller issues `g.stroke({...})` afterwards. The caller is also responsible
 * for snapping `dashLen` / `gapLen` so the perimeter is an exact multiple of
 * `dashLen + gapLen` — otherwise the dash phase jumps where the loop closes.
 */
export function drawDashedPolylineClosed(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  if (cycle <= 0 || poly.length < 3 || dashLen <= 0) return;
  const N = poly.length - 1;

  const segLens: number[] = new Array(N);
  let perimeter = 0;
  for (let i = 0; i < N; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segLens[i] = len;
    perimeter += len;
  }
  if (perimeter <= 0) return;

  const normOffset = ((offset % cycle) + cycle) % cycle;
  const firstDashStart = normOffset === 0 ? 0 : cycle - normOffset;
  const numDashes = Math.max(1, Math.round(perimeter / cycle));

  for (let k = 0; k < numDashes; k++) {
    const dashStart = (firstDashStart + k * cycle) % perimeter;
    const dashEnd = dashStart + dashLen;
    if (dashEnd <= perimeter) {
      emitArcClosed(g, poly, segLens, dashStart, dashEnd, false);
    } else {
      emitArcClosed(g, poly, segLens, dashStart, perimeter, false);
      emitArcClosed(g, poly, segLens, 0, dashEnd - perimeter, true);
    }
  }
}

function emitArcClosed(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  segLens: ReadonlyArray<number>,
  from: number,
  to: number,
  continueDash: boolean,
): void {
  if (to <= from) return;

  let acc = 0;
  let segIdx = 0;
  while (segIdx < segLens.length - 1 && acc + segLens[segIdx]! <= from) {
    acc += segLens[segIdx]!;
    segIdx++;
  }
  let local = from - acc;

  if (!continueDash) {
    const a = poly[segIdx]!;
    const b = poly[segIdx + 1]!;
    const segLen = segLens[segIdx]!;
    if (segLen <= 0) return;
    const ux = (b.x - a.x) / segLen;
    const uy = (b.y - a.y) / segLen;
    g.moveTo(a.x + ux * local, a.y + uy * local);
  }

  let remaining = to - from;
  while (remaining > 0 && segIdx < segLens.length) {
    const a = poly[segIdx]!;
    const b = poly[segIdx + 1]!;
    const segLen = segLens[segIdx]!;
    if (segLen <= 0) {
      segIdx++;
      local = 0;
      continue;
    }
    const ux = (b.x - a.x) / segLen;
    const uy = (b.y - a.y) / segLen;
    const stepInSeg = Math.min(remaining, segLen - local);
    g.lineTo(a.x + ux * (local + stepInSeg), a.y + uy * (local + stepInSeg));
    remaining -= stepInSeg;
    local += stepInSeg;
    if (local >= segLen - 1e-9) {
      segIdx++;
      local = 0;
    }
  }
}

/**
 * Stamp dashed segments along an OPEN polyline. Walks segment-by-segment with
 * a cumulative arc-length cursor; dashes that span a corner are emitted as a
 * single continuous sub-path so Pixi applies a proper line join at the corner
 * instead of doubled butt-caps.
 *
 * For closed polylines prefer `drawDashedPolylineClosed`, which also handles
 * seam wrap.
 */
export function drawDashedPolylineOpen(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  if (cycle <= 0) return;
  let s = -offset;
  let dashOpen = false;

  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen === 0) continue;
    const ux = dx / segLen;
    const uy = dy / segLen;

    let local = 0;
    while (local < segLen) {
      const within = (((s + local) % cycle) + cycle) % cycle;
      const isDash = within < dashLen;
      const remainingInPhase = isDash ? dashLen - within : cycle - within;
      const step = Math.min(remainingInPhase, segLen - local);

      if (isDash) {
        const px = a.x + ux * local;
        const py = a.y + uy * local;
        const ex = a.x + ux * (local + step);
        const ey = a.y + uy * (local + step);
        if (!dashOpen) {
          g.moveTo(px, py);
          dashOpen = true;
        }
        g.lineTo(ex, ey);
      } else {
        dashOpen = false;
      }

      const prev = local;
      local += step;
      if (local === prev) {
        dashOpen = false;
        break;
      }
    }
    s += segLen;
  }
}
