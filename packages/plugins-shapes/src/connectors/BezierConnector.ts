// ── BezierConnector ───────────────────────────────────────────────────────────
// Base class for cubic-bezier–family connectors. Holds the shared
// `curvePosition` / `curveOffset` API and geometry helpers used by
// CubicConnector, CubicHorizontalConnector, CubicVerticalConnector and
// QuadraticConnector.
//
// API:
//   - `controlPoints?: [Point, Point]` — explicit CPs, bypasses computation
//   - `curvePosition: number | [number, number]`
//       * scalar t          → both CPs share fraction t along the chord
//       * tuple   [t1, t2]  → t1 = cp1 fraction from source,
//                             t2 = cp2 fraction from target
//   - `curveOffset: number | [number, number]` — perpendicular offset(s)
//
// Subclasses override `route()` to choose how the helpers are applied
// (perpendicular bow, axis-locked horizontal/vertical, single-CP quadratic).

import { BaseConnector } from '../BaseConnector.js';
import type { BaseConnectorSpec, PathCommand, Point } from '../spec/index.js';

export interface BezierConnectorSpec extends BaseConnectorSpec {
  /**
   * Explicit control points. When set, `curvePosition` and `curveOffset` are ignored.
   * Cubic-family connectors expect exactly two points (`[cp1, cp2]`); the
   * array form is accepted so subclasses (e.g. Quadratic) can widen the
   * cardinality.
   */
  controlPoints?: [Point, Point] | Point[];
  /**
   * Relative position(s) of the control point(s) along the chord, range `0–1`.
   * Scalar applies to both CPs; tuple `[t1, t2]` controls cp1-from-source and
   * cp2-from-target independently. Default depends on subclass.
   */
  curvePosition?: number | [number, number];
  /**
   * Perpendicular offset(s) of the control point(s) from the chord, in world
   * pixels. Sign chooses the side. Scalar applies to both CPs; tuple `[o1, o2]`
   * controls cp1 and cp2 independently. Default depends on subclass.
   */
  curveOffset?: number | [number, number];
  /**
   * @deprecated Use {@link curveOffset} instead. Retained as a fallback when
   * `curveOffset` is not supplied so existing stories keep rendering.
   */
  curvature?: number;
}

export class BezierConnector<S extends BezierConnectorSpec = BezierConnectorSpec> extends BaseConnector<S> {
  /**
   * Default `curvePosition` when neither spec field nor override is provided.
   * `[0.25, 0.25]` places cp1 a quarter along the chord from source and cp2 a
   * quarter from target — the canonical "natural" cubic that produces a clean
   * single-arc bow. Older `[0.5, 0.5]` collapsed both CPs onto the chord
   * midpoint and produced a pinched look near the endpoints.
   */
  protected static readonly DEFAULT_POSITION: [number, number] = [0.25, 0.25];
  /** Default `curveOffset` when neither spec field nor override is provided. */
  protected static readonly DEFAULT_OFFSET:   [number, number] = [20, 20];

  route(from: Point, to: Point, waypoints: Point[]): PathCommand[] {
    const cp = this._explicitOrDefaultCps(from, to, waypoints);
    return [
      { cmd: 'M', x: from.x, y: from.y },
      { cmd: 'C', cp1x: cp.cp1.x, cp1y: cp.cp1.y, cp2x: cp.cp2.x, cp2y: cp.cp2.y, x: to.x, y: to.y },
    ];
  }

  /** Resolve scalar | tuple | undefined into a `[a, b]` pair. */
  protected _pair(
    val: number | [number, number] | number[] | undefined,
    def: [number, number],
  ): [number, number] {
    if (val === undefined) return def;
    if (typeof val === 'number') return [val, val];
    return [val[0] ?? def[0], val[1] ?? def[1]];
  }

  /** Compute perpendicular unit vector to chord (90° CCW). */
  protected _perp(from: Point, to: Point): { px: number; py: number; dx: number; dy: number; len: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return { px: -dy / len, py: dx / len, dx, dy, len };
  }

  /**
   * Default cubic geometry: cp1 at fraction t1 from source, cp2 at fraction t2
   * from target, each pushed perpendicular to the chord by their offset.
   */
  protected _defaultCubicCps(from: Point, to: Point): { cp1: Point; cp2: Point } {
    const fallback = this.spec.curvature !== undefined
      ? [this.spec.curvature, this.spec.curvature] as [number, number]
      : (this.constructor as typeof BezierConnector).DEFAULT_OFFSET;
    const [t1, t2] = this._pair(this.spec.curvePosition, (this.constructor as typeof BezierConnector).DEFAULT_POSITION);
    const [o1, o2] = this._pair(this.spec.curveOffset,   fallback);

    if (this.spec.fromAngle !== undefined && this.spec.toAngle !== undefined) {
      // Port- / angle-aware geometry — preserved from earlier implementation so
      // self-loops and explicit-port edges keep their existing visuals.
      return this._angleAwareCubicCps(from, to, t1, t2, o1, o2);
    }

    const { px, py, dx, dy } = this._perp(from, to);
    const cp1 = { x: from.x + dx * t1 + px * o1, y: from.y + dy * t1 + py * o1 };
    const cp2 = { x: to.x   - dx * t2 + px * o2, y: to.y   - dy * t2 + py * o2 };
    return { cp1, cp2 };
  }

  /**
   * Angle-aware variant: control points exit along source/target outward
   * normals, modulated by the same `(curvePosition, curveOffset)` pair so the
   * API stays consistent.
   */
  protected _angleAwareCubicCps(
    from: Point, to: Point,
    t1: number, t2: number, o1: number, o2: number,
  ): { cp1: Point; cp2: Point } {
    const { len } = this._perp(from, to);
    const fromAngle = this.spec.fromAngle!;
    const toAngle   = this.spec.toAngle!;
    const reach1 = Math.min(Math.max(o1, len * t1), len * 0.4);
    const reach2 = Math.min(Math.max(o2, len * t2), len * 0.4);
    const cos_f = Math.cos(fromAngle), sin_f = Math.sin(fromAngle);
    const cos_t = Math.cos(toAngle),   sin_t = Math.sin(toAngle);
    const perp_x = -sin_f, perp_y = cos_f;
    return {
      cp1: { x: from.x + reach1 * cos_f + reach1 * perp_x, y: from.y + reach1 * sin_f + reach1 * perp_y },
      cp2: { x: to.x   + reach2 * cos_t + reach2 * perp_x, y: to.y   + reach2 * sin_t + reach2 * perp_y },
    };
  }

  /**
   * Resolve cps from explicit override (`spec.controlPoints` or 2 waypoints)
   * or fall back to default cubic geometry.
   */
  protected _explicitOrDefaultCps(from: Point, to: Point, waypoints: Point[]): { cp1: Point; cp2: Point } {
    if (this.spec.controlPoints) {
      return { cp1: this.spec.controlPoints[0], cp2: this.spec.controlPoints[1] };
    }
    if (waypoints.length >= 2) {
      return { cp1: waypoints[0]!, cp2: waypoints[1]! };
    }
    if (waypoints.length === 1) {
      const mid = waypoints[0]!;
      return {
        cp1: { x: from.x + (mid.x - from.x) * 0.5, y: from.y + (mid.y - from.y) * 0.5 },
        cp2: { x: mid.x  + (to.x - mid.x)   * 0.5, y: mid.y  + (to.y - mid.y)   * 0.5 },
      };
    }
    return this._defaultCubicCps(from, to);
  }
}
