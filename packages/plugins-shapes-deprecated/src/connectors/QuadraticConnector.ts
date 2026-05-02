// ── QuadraticConnector ────────────────────────────────────────────────────────
// Single-control-point bezier. Extends BezierConnector to share the
// `curvePosition` / `curveOffset` API; only the first slot of each pair is
// honoured (a quadratic curve has just one CP).

import { BezierConnector, type BezierConnectorSpec } from './BezierConnector.js';
import type { PathCommand, Point } from '../spec/index.js';

export interface QuadraticConnectorSpec extends BezierConnectorSpec {
  /**
   * Explicit single control point. When set, `curvePosition` and `curveOffset`
   * are ignored.
   */
  controlPoint?: Point;
  /**
   * Array-form alias for {@link controlPoint}. Only the first element of the
   * array is used (a quadratic curve has one CP). When both `controlPoint`
   * and `controlPoints` are set, `controlPoint` wins.
   */
  controlPoints?: Point[] | [Point, Point];
}

export class QuadraticConnector extends BezierConnector<QuadraticConnectorSpec> {
  /** Default for quadratic: position 0.5, offset 30. */
  protected static override readonly DEFAULT_POSITION: [number, number] = [0.5, 0.5];
  protected static override readonly DEFAULT_OFFSET:   [number, number] = [30, 30];

  override route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const cp = this._resolveQuadraticCp(from, to, waypoints);
    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'Q', cpx: cp.x, cpy: cp.y, x: to.x, y: to.y },
    ];
  }

  private _resolveQuadraticCp(from: Point, to: Point, waypoints: Point[]): Point {
    if (this.spec.controlPoint) return this.spec.controlPoint;
    if (this.spec.controlPoints && this.spec.controlPoints.length >= 1) {
      return this.spec.controlPoints[0]!;
    }
    if (waypoints.length >= 1) return waypoints[0]!;

    const fallback = this.spec.curvature !== undefined
      ? [this.spec.curvature, this.spec.curvature] as [number, number]
      : QuadraticConnector.DEFAULT_OFFSET;
    const [t]   = this._pair(this.spec.curvePosition, QuadraticConnector.DEFAULT_POSITION);
    const [off] = this._pair(this.spec.curveOffset,   fallback);
    const { px, py, dx, dy } = this._perp(from, to);
    return { x: from.x + dx * t + px * off, y: from.y + dy * t + py * off };
  }
}
