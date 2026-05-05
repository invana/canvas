/**
 * Shared utilities for polygon/path decoration geometry.
 *
 * Used by built-in decorations to trace the actual host outline instead of
 * falling back to the AABB for `polygon` and `path` shape kinds.
 */

import { Graphics } from 'pixi.js';

type Pt = { readonly x: number; readonly y: number };

/**
 * Offset (expand or contract) a closed polygon by moving each edge outward by
 * `delta` pixels along its outward normal, then computing new vertex positions
 * as the intersection of adjacent offset edges.
 *
 * This produces a true "parallel offset" where every edge is exactly `delta`
 * pixels from the original edge — unlike centroid-based expansion, which
 * produces uneven offsets between edges and corners.
 *
 * Works correctly for convex polygons of any orientation (CW or CCW). For
 * concave polygons the result may self-intersect near re-entrant corners.
 */
export function offsetPolygon(pts: ReadonlyArray<Pt>, delta: number): Pt[] {
  if (pts.length === 0) return [];
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open: Pt[] = first.x === last.x && first.y === last.y ? pts.slice(0, -1) as Pt[] : [...pts] as Pt[];
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

  // Outward unit normal for each edge.
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

  // New vertex = intersection of the two adjacent offset edges.
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const prevEdge = (i - 1 + n) % n;
    const nj = edgeNormals[prevEdge]!; // normal of incoming edge
    const ni = edgeNormals[i]!;        // normal of outgoing edge
    const v = open[i]!;

    // A point on the offset of the incoming edge (shifted along nj).
    const p1 = { x: v.x + delta * nj.x, y: v.y + delta * nj.y };
    // Direction of the incoming edge.
    const prevV = open[prevEdge]!;
    const d1 = { x: v.x - prevV.x, y: v.y - prevV.y };

    // A point on the offset of the outgoing edge (shifted along ni).
    const p2 = { x: v.x + delta * ni.x, y: v.y + delta * ni.y };
    // Direction of the outgoing edge.
    const nextV = open[(i + 1) % n]!;
    const d2 = { x: nextV.x - v.x, y: nextV.y - v.y };

    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < 1e-10) {
      // Parallel edges (straight collinear corner) — offset lies on the normal.
      result.push({ x: v.x + delta * ni.x, y: v.y + delta * ni.y });
    } else {
      const ex = p2.x - p1.x;
      const ey = p2.y - p1.y;
      const t = (ex * d2.y - ey * d2.x) / cross;
      result.push({ x: p1.x + t * d1.x, y: p1.y + t * d1.y });
    }
  }

  // Close the polygon.
  if (result.length > 0) result.push({ ...result[0]! });
  return result;
}

/**
 * Expand (or contract when `delta` < 0) each vertex of a closed polyline
 * radially outward from the centroid. Works well for convex polygons; for
 * concave shapes the expansion may produce artefacts near re-entrant corners.
 */
export function expandPolyline(pts: ReadonlyArray<Pt>, delta: number): Pt[] {
  if (pts.length === 0) return [];
  // Exclude the duplicate closing point when computing the centroid.
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open = first.x === last.x && first.y === last.y ? pts.slice(0, -1) : pts;
  const cx = open.reduce((s, p) => s + p.x, 0) / open.length;
  const cy = open.reduce((s, p) => s + p.y, 0) / open.length;
  return pts.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: p.x, y: p.y };
    return { x: p.x + (dx / len) * delta, y: p.y + (dy / len) * delta };
  });
}

/**
 * Trace a closed polygon path onto `g`. Strips the duplicate closing point
 * (if present) so Pixi's auto-close doesn't produce a doubled vertex.
 * Caller issues `g.fill()` or `g.stroke()` (or both) after.
 */
export function polyToShape(g: Graphics, pts: ReadonlyArray<Pt>): void {
  if (pts.length < 3) return;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open =
    first.x === last.x && first.y === last.y ? pts.slice(0, -1) : pts;
  g.poly(open as { x: number; y: number }[]);
}

/**
 * Max distance from the centroid to any vertex of the polyline.
 * Used by `DashedBorderRotatingDecoration` to compute a tight circumscribed
 * circle radius instead of the loose AABB-diagonal approximation.
 */
export function maxRadiusFromCentroid(pts: ReadonlyArray<Pt>): number {
  if (pts.length === 0) return 0;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const open = first.x === last.x && first.y === last.y ? pts.slice(0, -1) : pts;
  const cx = open.reduce((s, p) => s + p.x, 0) / open.length;
  const cy = open.reduce((s, p) => s + p.y, 0) / open.length;
  return open.reduce((m, p) => Math.max(m, Math.hypot(p.x - cx, p.y - cy)), 0);
}
