// ── SmoothConnector ───────────────────────────────────────────────────────────
// Catmull-Rom spline through all provided waypoints.

import { BaseEdge } from '../BaseEdge.js';
import type { BaseEdgeSpec, PathCommand, Point } from '../spec/index.js';

/** Spec for a smooth (Catmull-Rom) spline connector. */
export interface SmoothConnectorSpec extends BaseEdgeSpec {
  /**
   * Tension parameter for the Catmull-Rom spline.
   * - `0.0` → tighter curves (passes through points sharply)
   * - `0.5` (default) → standard Catmull-Rom
   * - `1.0` → looser curves
   */
  tension?: number;
}

/**
 * Smooth connector.
 *
 * @remarks
 * Converts the point sequence `[from, ...waypoints, to]` into a Catmull-Rom
 * spline by converting each segment to a cubic Bézier curve.
 * This ensures the path passes *through* every point.
 */
export class SmoothConnector extends BaseEdge<SmoothConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const pts: Point[] = [from, ...waypoints, to];
    const tension = this.spec.tension ?? 0.5;

    if (pts.length === 2) {
      // Only two points — degenerate to straight line
      return [
        { cmd: 'M', x: from.x, y: from.y },
        { cmd: 'L', x: to.x,   y: to.y   },
      ];
    }

    return catmullRomToBezier(pts, tension);
  }
}

// ── Catmull-Rom → cubic Bézier conversion ─────────────────────────────────────

/**
 * Converts a sequence of points to cubic Bézier {@link PathCommand}s using the
 * Catmull-Rom spline algorithm.
 *
 * Ghost points are added at both ends so the curve starts and ends exactly at
 * the first and last points.
 */
function catmullRomToBezier(pts: Point[], tension: number): PathCommand[] {
  const alpha = tension;
  // Duplicate endpoints as ghost control points
  const all: Point[] = [
    _reflect(pts[1]!, pts[0]!),
    ...pts,
    _reflect(pts[pts.length - 2]!, pts[pts.length - 1]!),
  ];

  const cmds: PathCommand[] = [
    { cmd: 'M', x: pts[0]!.x, y: pts[0]!.y },
  ];

  for (let i = 1; i < all.length - 2; i++) {
    const p0 = all[i - 1]!;
    const p1 = all[i]!;
    const p2 = all[i + 1]!;
    const p3 = all[i + 2]!;

    const cp1: Point = {
      x: p1.x + (p2.x - p0.x) * alpha / 6,
      y: p1.y + (p2.y - p0.y) * alpha / 6,
    };
    const cp2: Point = {
      x: p2.x - (p3.x - p1.x) * alpha / 6,
      y: p2.y - (p3.y - p1.y) * alpha / 6,
    };

    cmds.push({
      cmd: 'C',
      cp1x: cp1.x, cp1y: cp1.y,
      cp2x: cp2.x, cp2y: cp2.y,
      x: p2.x, y: p2.y,
    });
  }

  return cmds;
}

/** Reflect point `b` across point `a` to create a ghost endpoint. */
function _reflect(a: Point, b: Point): Point {
  return { x: 2 * b.x - a.x, y: 2 * b.y - a.y };
}
