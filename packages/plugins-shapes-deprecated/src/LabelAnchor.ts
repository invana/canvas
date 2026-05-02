// ── LabelAnchor ───────────────────────────────────────────────────────────────
// Pure helpers for resolving label anchor points on shapes (bbox-based) and
// connectors (route-based). Used by ShapeObject when it walks an element's
// `spec.label` list each draw cycle.

import type { LabelAnchor } from '@invana/canvas-deprecated';
import type {
  BBox,
  EdgeLabelPosition,
  NodeLabelPosition,
  PathCommand,
  Point,
} from './spec/index.js';

/** Outward gap (world px) used when a node label sits outside the bbox. */
const NODE_LABEL_OUTSIDE_GAP = 8;

/**
 * Resolve a {@link NodeLabelPosition} keyword + offsets into a world-space
 * anchor on the given bounding box.
 *
 * - `'center'` sits at the bbox centre.
 * - Cardinal positions (`'top'`, `'bottom'`, `'left'`, `'right'`) sit just
 *   outside the corresponding edge (8 px gap).
 * - Corner positions (`'top-left'`, …) sit outside the corner.
 */
export function resolveNodeAnchor(
  bbox: BBox,
  position: NodeLabelPosition,
  offsetX: number,
  offsetY: number,
): LabelAnchor {
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const g  = NODE_LABEL_OUTSIDE_GAP;
  let x: number, y: number;
  switch (position) {
    case 'center':       x = cx;            y = cy;            break;
    case 'top':          x = cx;            y = bbox.minY - g; break;
    case 'bottom':       x = cx;            y = bbox.maxY + g; break;
    case 'left':         x = bbox.minX - g; y = cy;            break;
    case 'right':        x = bbox.maxX + g; y = cy;            break;
    case 'top-left':     x = bbox.minX - g; y = bbox.minY - g; break;
    case 'top-right':    x = bbox.maxX + g; y = bbox.minY - g; break;
    case 'bottom-left':  x = bbox.minX - g; y = bbox.maxY + g; break;
    case 'bottom-right': x = bbox.maxX + g; y = bbox.maxY + g; break;
  }
  return { x: x + offsetX, y: y + offsetY };
}

/**
 * Resolve an {@link EdgeLabelPosition} into a world-space anchor on the route,
 * including the path tangent at that point and a perpendicular offset.
 *
 * `position`:
 * - `'start'` — at the route's first point.
 * - `'end'` — at the route's last point.
 * - `'middle'` (default) — at arclength 0.5.
 * - `number` — fractional arclength (0..1).
 *
 * `offset` shifts perpendicular to the tangent: positive moves to the right of
 * the direction of travel (matches the EdgeLabelSpec.offset semantics).
 */
export function resolveEdgeAnchor(
  route: PathCommand[],
  position: EdgeLabelPosition,
  offset: number,
): LabelAnchor {
  const samples = sampleRoute(route);
  if (samples.length < 2) {
    const p = samples[0] ?? { x: 0, y: 0 };
    return { x: p.x, y: p.y, tangent: 0 };
  }

  let t: number;
  if (position === 'start')       t = 0;
  else if (position === 'end')    t = 1;
  else if (position === 'middle') t = 0.5;
  else                            t = clamp01(position);

  const { point, tangent } = pointAndTangentAt(samples, t);

  // Apply perpendicular offset.  Right-hand normal to direction of travel
  // (cos θ, sin θ) is (sin θ, -cos θ).  EdgeLabelSpec.offset is signed:
  // positive = right of travel; negative (the typical "above the line" for a
  // left-to-right edge) = left of travel.
  const nx =  Math.sin(tangent);
  const ny = -Math.cos(tangent);
  return {
    x: point.x + nx * offset,
    y: point.y + ny * offset,
    tangent,
  };
}

// ── Internals ────────────────────────────────────────────────────────────────

/**
 * Flatten a route into a polyline of sample points. Bezier/quadratic segments
 * are sampled at fixed steps — sufficient for label placement, where we don't
 * need exact arclength.
 */
function sampleRoute(route: PathCommand[]): Point[] {
  const out: Point[] = [];
  let prev: Point | null = null;
  const STEPS_C = 12;
  const STEPS_Q = 8;
  for (const cmd of route) {
    switch (cmd.cmd) {
      case 'M':
        out.push({ x: cmd.x, y: cmd.y });
        prev = { x: cmd.x, y: cmd.y };
        break;
      case 'L':
        out.push({ x: cmd.x, y: cmd.y });
        prev = { x: cmd.x, y: cmd.y };
        break;
      case 'C':
        if (prev) {
          for (let i = 1; i <= STEPS_C; i++) {
            const u = i / STEPS_C;
            out.push(cubic(prev, { x: cmd.cp1x, y: cmd.cp1y }, { x: cmd.cp2x, y: cmd.cp2y }, { x: cmd.x, y: cmd.y }, u));
          }
        }
        prev = { x: cmd.x, y: cmd.y };
        break;
      case 'Q':
        if (prev) {
          for (let i = 1; i <= STEPS_Q; i++) {
            const u = i / STEPS_Q;
            out.push(quadratic(prev, { x: cmd.cpx, y: cmd.cpy }, { x: cmd.x, y: cmd.y }, u));
          }
        }
        prev = { x: cmd.x, y: cmd.y };
        break;
      case 'Z':
        // No new point — connectors don't typically use Z.
        break;
    }
  }
  return out;
}

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function quadratic(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Find the point + local tangent at fractional arclength `t` (0..1). */
function pointAndTangentAt(
  samples: Point[],
  t: number,
): { point: Point; tangent: number } {
  // Cumulative arclength.
  const cum: number[] = [0];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!;
    const b = samples[i]!;
    cum.push(cum[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = cum[cum.length - 1]!;
  if (total < 1e-9) {
    const p = samples[0]!;
    return { point: { x: p.x, y: p.y }, tangent: 0 };
  }
  const target = total * t;

  // Binary search the segment containing `target`.
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cum[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  const segEnd = Math.max(1, lo);
  const segStart = segEnd - 1;
  const a = samples[segStart]!;
  const b = samples[segEnd]!;
  const segLen = cum[segEnd]! - cum[segStart]!;
  const u = segLen < 1e-9 ? 0 : (target - cum[segStart]!) / segLen;
  return {
    point:   { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u },
    tangent: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
