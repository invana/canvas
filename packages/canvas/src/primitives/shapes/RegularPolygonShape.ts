import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import {
  offsetPolygon,
  pointInPolygon,
  polygonBounds,
  rayPolygonIntersection,
  regularPolygonVertices,
} from './_polyUtils';
import type {
  Point,
  Rect,
  RegularPolygonSpec,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Regular n-gon centred at `(spec.x, spec.y)` with circum-radius
 * `spec.radius`. With `rotation = 0` the first vertex points straight up, so
 * a triangle / pentagon / heptagon points up by default and a hexagon is
 * pointy-top. Pass `rotation: Math.PI / 6` for a flat-top hexagon.
 *
 * Vertices are recomputed on every `draw`. For hot paths consider caching at
 * the spec level — but a regular polygon's vertex count is small so the cost
 * is dominated by Pixi's path emission, not the trig.
 */
export class RegularPolygonShape extends ShapeBase<RegularPolygonSpec> {
  static readonly kind = 'regular-polygon';

  constructor(spec: RegularPolygonSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: RegularPolygonSpec, style?: ShapePaintStyle): void {
    const baseInset = style?.inset ?? 0;
    const verts = computeVertices(spec, baseInset);
    if (verts.length < 3) return;

    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, verts, {
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
      const v = extra > 0 ? computeVertices(spec, baseInset + extra) : verts;
      if (v.length >= 3) tracePolygon(g, v);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }

  bounds(): Rect {
    return RegularPolygonShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<RegularPolygonSpec, 'x' | 'y'>): Rect {
    return polygonBounds(regularPolygonVertices(spec.sides, spec.radius, spec.rotation ?? 0));
  }

  static scaleSpec(
    spec: Omit<RegularPolygonSpec, 'x' | 'y'>,
    factor: number,
  ): Partial<RegularPolygonSpec> {
    return { radius: spec.radius * factor };
  }

  /**
   * Vertices are placed symmetrically around the origin by
   * `regularPolygonVertices`, so the local origin is the centroid. The AABB
   * midpoint is offset for odd-sided polygons (triangle / pentagon /
   * heptagon) — using the origin instead keeps an inset glyph centred on
   * the visual mass rather than floating toward the apex.
   */
  override visualCenter(): Point {
    return { x: 0, y: 0 };
  }

  contains(localX: number, localY: number): boolean {
    return pointInPolygon(localX, localY, computeVertices(this.spec, 0));
  }

  override boundaryIntersect(localFromCenter: Point): Point | null {
    return rayPolygonIntersection(localFromCenter, computeVertices(this.spec, 0));
  }

  obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const baseVerts = computeVertices(this.spec, 0);
    let cachedInflate = Number.NaN;
    let cachedVerts: ReadonlyArray<Point> = baseVerts;
    return (worldX, worldY, inflate) => {
      if (inflate !== cachedInflate) {
        cachedInflate = inflate;
        cachedVerts = inflate === 0 ? baseVerts : offsetPolygon(baseVerts, -inflate);
      }
      return pointInPolygon(worldX - cx, worldY - cy, cachedVerts);
    };
  }

  static paintInto(
    g: Graphics,
    spec: Omit<RegularPolygonSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const base = regularPolygonVertices(
      spec.sides,
      Math.max(0, spec.radius - (style?.inset ?? 0)),
      spec.rotation ?? 0,
    );
    if (base.length < 3) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed: Point[] = base.map((v) => ({
      x: anchor.x + v.x * cos - v.y * sin,
      y: anchor.y + v.x * sin + v.y * cos,
    }));
    tracePolygon(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
}

function computeVertices(spec: RegularPolygonSpec, inset: number): Point[] {
  const r = Math.max(0, spec.radius - inset);
  return regularPolygonVertices(spec.sides, r, spec.rotation ?? 0);
}

function tracePolygon(g: Graphics, vertices: ReadonlyArray<Point>): void {
  const first = vertices[0]!;
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]!;
    g.lineTo(v.x, v.y);
  }
  g.closePath();
}
