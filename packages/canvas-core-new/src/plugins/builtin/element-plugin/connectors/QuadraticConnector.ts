// ── QuadraticConnector ────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

/**
 * A quadratic Bézier connector.
 *
 * @remarks
 * If `waypoints` / `vertices` contains one point it is used as the control point.
 * If empty, the control point is auto-computed as the perpendicular midpoint.
 */
export interface QuadraticConnectorSpec extends BaseConnectorSpec {
  /**
   * Perpendicular curvature offset when no explicit control point is provided.
   * Default: 60.
   */
  curvature?: number;
}

export class QuadraticConnector extends BaseConnector<QuadraticConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    let cp: Point;

    if (waypoints.length >= 1) {
      cp = waypoints[0]!;
    } else {
      const curvature = this.spec.curvature ?? 60;
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      cp = {
        x: mx + (-dy / len) * curvature,
        y: my + ( dx / len) * curvature,
      };
    }

    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'Q', cpx: cp.x, cpy: cp.y, x: to.x, y: to.y },
    ];
  }
}
