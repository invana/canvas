import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
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
 * layers (glyph / svg / image-inset) are mounted as sibling Containers by
 * `ShapeBase` — they appear centred (or anchored) inside the circle.
 */
export class CircleShape extends ShapeBase<CircleSpec> {
  static readonly kind = 'circle';

  constructor(spec: CircleSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: CircleSpec, style?: ShapePaintStyle): void {
    const r = Math.max(0, spec.radius - (style?.inset ?? 0));
    const trace = () => g.circle(0, 0, r);
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    trace();
    applyStroke(g, spec, style);
  }

  bounds(): Rect {
    const r = this.spec.radius;
    return { x: -r, y: -r, width: r * 2, height: r * 2 };
  }

  contains(localX: number, localY: number): boolean {
    const r = this.spec.radius;
    return localX * localX + localY * localY <= r * r;
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
    g.circle(anchor.x, anchor.y, r);
    applyMarkerFill(g, spec.fill, style);
  }
}
