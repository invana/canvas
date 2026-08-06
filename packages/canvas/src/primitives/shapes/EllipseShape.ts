import type { Graphics } from 'pixi.js';
import { boundsOfEllipse, containsEllipse, scaleEllipse } from '../../specs/shapeGeometry';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import type {
  EllipseSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Filled / stroked ellipse. Centred at `(spec.x, spec.y)`; the silhouette is
 * traced in shape-local space (origin at the centre) with independent
 * `radiusX` / `radiusY`. The circle's two-radius sibling — used directly, or
 * borrowed by {@link CompositeShape} for an elliptical card body. Inset-content
 * fill layers (glyph / svg) are mounted centred by `ShapeBase`.
 */
export class EllipseShape extends ShapeBase<EllipseSpec> {
  static readonly kind = 'ellipse';

  constructor(spec: EllipseSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: EllipseSpec, style?: ShapePaintStyle): void {
    const baseInset = style?.inset ?? 0;

    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      const rx = Math.max(0, spec.radiusX - baseInset);
      const ry = Math.max(0, spec.radiusY - baseInset);
      emitDashedStroke(g, sampleEllipseOutline(rx, ry), {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true,
      });
      return;
    }

    const trace = (extra = 0) => {
      const rx = Math.max(0, spec.radiusX - baseInset - extra);
      const ry = Math.max(0, spec.radiusY - baseInset - extra);
      g.ellipse(0, 0, rx, ry);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }

  bounds(): Rect {
    return EllipseShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<EllipseSpec, 'x' | 'y'>): Rect {
    return boundsOfEllipse(spec);
  }

  static scaleSpec(spec: Omit<EllipseSpec, 'x' | 'y'>, factor: number): Partial<EllipseSpec> {
    return scaleEllipse(spec, factor);
  }

  contains(localX: number, localY: number): boolean {
    return containsEllipse(this.spec, localX, localY);
  }

  /**
   * Analytical perimeter intersection. The ellipse is centred at its origin,
   * so the boundary point along the ray from `(0, 0)` toward `localFromCenter`
   * scales the direction so it lands on the ellipse: solve
   * `((t·dx)/rx)² + ((t·dy)/ry)² = 1` for `t`. Degenerate ray → `(rx, 0)`.
   */
  override boundaryIntersect(localFromCenter: Point): Point {
    const { radiusX: rx, radiusY: ry } = this.spec;
    const dx = localFromCenter.x;
    const dy = localFromCenter.y;
    if ((dx === 0 && dy === 0) || rx <= 0 || ry <= 0) return { x: rx, y: 0 };
    const denom = Math.sqrt((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry));
    if (denom === 0) return { x: rx, y: 0 };
    const t = 1 / denom;
    return { x: dx * t, y: dy * t };
  }

  /**
   * Static paint surface for marker rendering — paints into a connector's
   * Graphics at `anchor` with no instantiation. Only the first solid layer of
   * `spec.fill` applies (markers don't support image fills / inset content).
   */
  static paintInto(
    g: Graphics,
    spec: Omit<EllipseSpec, 'x' | 'y'>,
    anchor: Point,
    _angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const inset = style?.inset ?? 0;
    g.ellipse(anchor.x, anchor.y, Math.max(0, spec.radiusX - inset), Math.max(0, spec.radiusY - inset));
    applyMarkerFill(g, spec.fill, style);
  }
}

/**
 * Densify the ellipse outline into a polyline for dashed-stroke emission.
 * Step count is proportional to the (approximate) perimeter, clamped so small
 * ellipses stay smooth. Centred at the origin, counter-clockwise from `(rx, 0)`.
 */
function sampleEllipseOutline(rx: number, ry: number): Point[] {
  if (rx <= 0 || ry <= 0) return [];
  const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const n = Math.max(24, Math.ceil(perim / 4));
  const out: Point[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out[i] = { x: Math.cos(a) * rx, y: Math.sin(a) * ry };
  }
  return out;
}
