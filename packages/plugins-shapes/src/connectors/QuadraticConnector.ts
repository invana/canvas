// ── QuadraticConnector ────────────────────────────────────────────────────────

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

export interface QuadraticConnectorSpec extends BaseConnectorSpec {
  curvature?: number;
}

export class QuadraticConnector extends BaseConnector<QuadraticConnectorSpec> {
  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    let cp: Point;

    if (waypoints.length >= 1) {
      cp = waypoints[0]!;
    } else {
      const curvature = this.spec.curvature ?? 60;
      const fromAngle = this.spec.fromAngle;
      const toAngle   = this.spec.toAngle;
      const dx        = to.x - from.x, dy = to.y - from.y;
      const dist      = Math.sqrt(dx * dx + dy * dy) || 1;

      if (fromAngle !== undefined && toAngle !== undefined) {
        // Mirror the bezier approach: two candidate control points using outward-normal
        // + 90°-CCW perpendicular, then average them for the single quadratic cp.
        const d      = Math.min(curvature, dist * 0.4);
        const cos_f  = Math.cos(fromAngle), sin_f = Math.sin(fromAngle);
        const perp_x = -sin_f, perp_y = cos_f;
        const cos_t  = Math.cos(toAngle), sin_t = Math.sin(toAngle);
        const p1 = { x: from.x + d * cos_f + d * perp_x, y: from.y + d * sin_f + d * perp_y };
        const p2 = { x: to.x   + d * cos_t + d * perp_x, y: to.y   + d * sin_t + d * perp_y };
        cp = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      } else {
        const mx  = (from.x + to.x) / 2;
        const my  = (from.y + to.y) / 2;
        const len = dist;
        cp = {
          x: mx + (-dy / len) * curvature,
          y: my + ( dx / len) * curvature,
        };
      }
    }

    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'Q', cpx: cp.x, cpy: cp.y, x: to.x, y: to.y },
    ];
  }
}
