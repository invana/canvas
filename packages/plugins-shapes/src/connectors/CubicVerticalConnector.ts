// ── CubicVerticalConnector ────────────────────────────────────────────────────
// Cubic bezier with axis-locked control points along the y-axis. Each control
// point shares the x-coordinate of its associated endpoint, so the curve exits
// the source vertically and enters the target vertically — the canonical
// org-chart / tree shape regardless of the chord's slope.

import { BezierConnector, type BezierConnectorSpec } from './BezierConnector.js';
import type { PathCommand, Point } from '../spec/index.js';

export type CubicVerticalConnectorSpec = BezierConnectorSpec;

export class CubicVerticalConnector extends BezierConnector<CubicVerticalConnectorSpec> {
  /** Default for cubic-vertical: position [0.5, 0.5], offset [0, 0]. */
  protected static override readonly DEFAULT_POSITION: [number, number] = [0.5, 0.5];
  protected static override readonly DEFAULT_OFFSET:   [number, number] = [0, 0];

  override route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const cps = this.spec.controlPoints
      ? { cp1: this.spec.controlPoints[0], cp2: this.spec.controlPoints[1] }
      : waypoints.length >= 2
        ? { cp1: waypoints[0]!, cp2: waypoints[1]! }
        : this._verticalCps(from, to);
    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'C', cp1x: cps.cp1.x, cp1y: cps.cp1.y, cp2x: cps.cp2.x, cp2y: cps.cp2.y, x: to.x, y: to.y },
    ];
  }

  private _verticalCps(from: Point, to: Point): { cp1: Point; cp2: Point } {
    const fallback = this.spec.curvature !== undefined
      ? [this.spec.curvature, this.spec.curvature] as [number, number]
      : CubicVerticalConnector.DEFAULT_OFFSET;
    const [t1, t2] = this._pair(this.spec.curvePosition, CubicVerticalConnector.DEFAULT_POSITION);
    const [o1, o2] = this._pair(this.spec.curveOffset,   fallback);
    const dy = to.y - from.y;
    return {
      cp1: { x: from.x + o1, y: from.y + dy * t1 },
      cp2: { x: to.x   + o2, y: to.y   - dy * t2 },
    };
  }
}
