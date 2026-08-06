import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import { pointInPolygon, polygonBounds } from './_polyUtils';
import type { PathSpec, Point, Rect, ShapeHostInfo, ShapePaintStyle } from '../types';

/**
 * Free-form polyline / outline. Points are centre-relative — traced around the
 * origin in shape-local space, with the `gfx` Container translating the result
 * to `(spec.x, spec.y)`, exactly like {@link PolygonShape}.
 *
 * The difference from `polygon` is the **open** default: a path is a run of
 * points that only closes when `spec.closed` says so. That is what computed
 * geometry needs — density-contour bands, bubble-set hulls, region outlines —
 * where the producer emits a point list rather than a parameterised silhouette.
 *
 * Hit-testing treats an open path as its closed polygon, which is the useful
 * answer for a filled hull and a harmless approximation for a thin outline.
 */
export class PathShape extends ShapeBase<PathSpec> {
  static readonly kind = 'path';

  constructor(spec: PathSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: PathSpec, style?: ShapePaintStyle): void {
    const pts = spec.points;
    if (pts.length < 2) return;

    const closed = spec.closed === true || spec.smooth === true;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, pts, {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed,
      });
      return;
    }

    const trace = (): void => {
      if (spec.smooth === true) {
        traceSmoothClosed(g, pts);
        return;
      }
      const [first, ...rest] = pts;
      if (!first) return;
      g.moveTo(first.x, first.y);
      for (const p of rest) g.lineTo(p.x, p.y);
      if (closed) g.closePath();
    };

    trace();
    // A fill only makes sense on a closed run; an open path is stroke-only.
    if (closed) applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }

  bounds(): Rect {
    return PathShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<PathSpec, 'x' | 'y'>): Rect {
    return polygonBounds(spec.points);
  }

  static scaleSpec(spec: Omit<PathSpec, 'x' | 'y'>, factor: number): Partial<PathSpec> {
    return { points: spec.points.map((p) => ({ x: p.x * factor, y: p.y * factor })) };
  }

  /** Points are authored centre-relative, so the local origin is the centre. */
  override visualCenter(): Point {
    return { x: 0, y: 0 };
  }

  contains(localX: number, localY: number): boolean {
    return this.spec.points.length >= 3 && pointInPolygon(localX, localY, this.spec.points);
  }
}

/**
 * Closed quadratic spline through segment midpoints, using each input point as
 * an off-curve control point. C¹ continuous, so a stair-stepped polyline draws
 * as a smooth contour — the smoothing lives here, in the geometry, rather than
 * in whoever produced the points.
 */
function traceSmoothClosed(g: Graphics, pts: readonly Point[]): void {
  const n = pts.length;
  if (n < 3) return;
  const last = pts[n - 1]!;
  const first = pts[0]!;
  let mx = (last.x + first.x) * 0.5;
  let my = (last.y + first.y) * 0.5;
  g.moveTo(mx, my);
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    mx = (a.x + b.x) * 0.5;
    my = (a.y + b.y) * 0.5;
    g.quadraticCurveTo(a.x, a.y, mx, my);
  }
  g.closePath();
}
