// ── CubicHorizontalConnector ──────────────────────────────────────────────────
// Cubic bezier with axis-locked control points along the x-axis. Each control
// point shares the y-coordinate of its associated endpoint, so the curve exits
// the source horizontally and enters the target horizontally — the canonical
// flowchart "S" shape regardless of the chord's slope.

import { BezierConnector, type BezierConnectorSpec } from './BezierConnector.js';
import type { PathCommand, Point } from '../spec/index.js';

export type CubicHorizontalConnectorSpec = BezierConnectorSpec;

export class CubicHorizontalConnector extends BezierConnector<CubicHorizontalConnectorSpec> {
  /** Default for cubic-horizontal: position [0.5, 0.5], offset [0, 0]. */
  protected static override readonly DEFAULT_POSITION: [number, number] = [0.5, 0.5];
  protected static override readonly DEFAULT_OFFSET:   [number, number] = [0, 0];

  override route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const cps = this.spec.controlPoints
      ? { cp1: this.spec.controlPoints[0], cp2: this.spec.controlPoints[1] }
      : waypoints.length >= 2
        ? { cp1: waypoints[0]!, cp2: waypoints[1]! }
        : this._horizontalCps(from, to);
    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'C', cp1x: cps.cp1.x, cp1y: cps.cp1.y, cp2x: cps.cp2.x, cp2y: cps.cp2.y, x: to.x, y: to.y },
    ];
  }

  private _horizontalCps(from: Point, to: Point): { cp1: Point; cp2: Point } {
    const fallback = this.spec.curvature !== undefined
      ? [this.spec.curvature, this.spec.curvature] as [number, number]
      : CubicHorizontalConnector.DEFAULT_OFFSET;
    const [t1, t2] = this._pair(this.spec.curvePosition, CubicHorizontalConnector.DEFAULT_POSITION);
    const [o1, o2] = this._pair(this.spec.curveOffset,   fallback);
    const dx = to.x - from.x;
    return {
      cp1: { x: from.x + dx * t1, y: from.y + o1 },
      cp2: { x: to.x   - dx * t2, y: to.y   + o2 },
    };
  }
}
