import type { Graphics } from 'pixi.js';
import { boundsOfCircle, containsCircle, scaleCircle } from '@invana/canvas';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import type {
  CircleSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Filled / stroked circle. Centered at `(spec.x, spec.y)`; the silhouette
 * is traced in shape-local space (origin at the center). Inset-content fill
 * layers (glyph / svg / svg-url) are mounted as sibling Containers by
 * `ShapeBase` — they appear centred (or anchored) inside the circle.
 */
export class CircleShape extends ShapeBase<CircleSpec> {
  static readonly kind = 'circle';

  constructor(spec: CircleSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: CircleSpec, style?: ShapePaintStyle): void {
    const baseInset = style?.inset ?? 0;
    const r = Math.max(0, spec.radius - baseInset);

    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, sampleCircleOutline(r), {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true,
      });
      return;
    }

    // Pixi's `g.circle(...)` chooses segment count from the world-coord
    // radius — at very small radii (e.g. when `ScreenSizeBehaviour` shrinks
    // a screen-constant node's world radius to ~0.01 at high camera zoom)
    // it falls to 4–6 segments and the result reads as a diamond / octagon.
    // We trace through `regularPoly` with a floor of 32 sides, which is
    // visually indistinguishable from a true circle at any reasonable
    // effective size while staying cheap on the vertex budget.
    const trace = (extra = 0) => {
      const rr = Math.max(0, spec.radius - baseInset - extra);
      const segments = Math.max(32, Math.ceil((Math.PI * 2 * rr) / 4));
      g.regularPoly(0, 0, rr, segments);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }

  bounds(): Rect {
    return CircleShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<CircleSpec, 'x' | 'y'>): Rect {
    return boundsOfCircle(spec);
  }

  static scaleSpec(spec: Omit<CircleSpec, 'x' | 'y'>, factor: number): Partial<CircleSpec> {
    return scaleCircle(spec, factor);
  }

  contains(localX: number, localY: number): boolean {
    return containsCircle(this.spec, localX, localY);
  }

  /**
   * Analytical perimeter intersection. `CircleShape` is centred at its
   * origin, so "centre-relative" and "origin-relative" local coords are the
   * same here. The boundary point along the ray from `(0, 0)` toward
   * `localFromCenter` is just the unit vector scaled by the radius.
   * When `localFromCenter` coincides with the centre the ray is degenerate;
   * we return `(r, 0)` as a stable sentinel.
   */
  override boundaryIntersect(localFromCenter: Point): Point {
    const d = Math.hypot(localFromCenter.x, localFromCenter.y);
    const r = this.spec.radius;
    if (d === 0) return { x: r, y: 0 };
    return { x: (localFromCenter.x / d) * r, y: (localFromCenter.y / d) * r };
  }

  /**
   * Silhouette obstacle-test for routers. Returns a closure over the
   * circle's current `(centre, radius)` that tests world points against
   * the inflated disc — pixel-tight, not the AABB-square. Routes hug the
   * circle's tangent instead of avoiding its bounding box corners.
   */
  obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const r = this.spec.radius;
    return (worldX, worldY, inflate) => {
      const dx = worldX - cx;
      const dy = worldY - cy;
      const limit = r + inflate;
      return dx * dx + dy * dy <= limit * limit;
    };
  }

  /**
   * Static paint surface for marker rendering. Connectors call this when
   * a circle is used as a source/target marker (no instantiation, just a
   * paint into someone else's Graphics). Only the first solid layer of
   * `spec.fill` is honoured here — markers don't support image fills or
   * inset content.
   */
  static paintInto(
    g: Graphics,
    spec: Omit<CircleSpec, 'x' | 'y'>,
    anchor: Point,
    _angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const r = Math.max(0, spec.radius - (style?.inset ?? 0));
    // Same fixed-segment trace as the instance path — see comment in
    // `draw()` above. Markers occasionally render at small effective
    // sizes (high-zoom edge tips), so the floor matters here too.
    const segments = Math.max(32, Math.ceil((Math.PI * 2 * r) / 4));
    g.regularPoly(anchor.x, anchor.y, r, segments);
    applyMarkerFill(g, spec.fill, style);
  }
}

/**
 * Densify the circle outline into a polyline for dashed-stroke emission.
 * Step count is proportional to perimeter (≈ 1 vertex per 4 px), clamped
 * to a minimum that keeps small circles smooth. Output is centred at the
 * origin and traverses counter-clockwise from `(r, 0)`.
 */
function sampleCircleOutline(r: number): Point[] {
  if (r <= 0) return [];
  const n = Math.max(24, Math.ceil((Math.PI * 2 * r) / 4));
  const out: Point[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  return out;
}
