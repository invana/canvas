// ── BezierConnector ───────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

/**
 * A cubic Bézier connector.
 *
 * @remarks
 * If `waypoints` contains two points they are used as control points (cp1, cp2).
 * If `waypoints` is empty or undefined, control points are auto-computed with
 * a perpendicular offset of `curvature` world pixels (default 80).
 */
export interface BezierConnectorSpec extends BaseConnectorSpec {
  /**
   * Strength of the auto-computed curve when no explicit control points are given.
   * A larger value creates a wider arc.  Default: 80.
   */
  curvature?: number;
}

export class BezierConnector extends BaseConnector<BezierConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    let cp1: Point, cp2: Point;

    if (waypoints.length >= 2) {
      // Explicit control points
      cp1 = waypoints[0]!;
      cp2 = waypoints[1]!;
    } else if (waypoints.length === 1) {
      // Single waypoint → use as midpoint, auto-derive cp1/cp2
      const mid = waypoints[0]!;
      cp1 = { x: from.x + (mid.x - from.x) * 0.5, y: from.y + (mid.y - from.y) * 0.5 };
      cp2 = { x: mid.x  + (to.x - mid.x)   * 0.5, y: mid.y  + (to.y - mid.y)   * 0.5 };
    } else {
      // Auto-compute control points with perpendicular offset
      const curvature = this.spec.curvature ?? 80;
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = (-dy / len) * curvature;
      const py = ( dx / len) * curvature;

      cp1 = { x: from.x + (mx - from.x) * 0.5 + px, y: from.y + (my - from.y) * 0.5 + py };
      cp2 = { x: mx + (to.x - mx) * 0.5 + px,        y: my + (to.y - my) * 0.5 + py };
    }

    return [
      { cmd: 'M',  x: from.x, y: from.y },
      { cmd: 'C',  cp1x: cp1.x, cp1y: cp1.y, cp2x: cp2.x, cp2y: cp2.y, x: to.x, y: to.y },
    ];
  }
}
