import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import {
  boundsOfStar,
  containsStar,
  offsetPolygon,
  pointInPolygon,
  rayPolygonIntersection,
  scaleStar,
  starVertices,
} from '@invana/canvas';
import type {
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
  StarSpec,
} from '../types';

/**
 * N-pointed star centred at `(spec.x, spec.y)`. `points` controls the number
 * of outer tips; vertices alternate between `outerRadius` and `innerRadius`.
 * With `rotation = 0` the first outer tip points straight up. The silhouette
 * is concave by construction — the bisector-based `offsetPolygon` inset is
 * an approximation for thin / decorative insets only; deep insets may
 * self-intersect.
 */
export class StarShape extends ShapeBase<StarSpec> {
  static readonly kind = 'star';

  constructor(spec: StarSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: StarSpec, style?: ShapePaintStyle): void {
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
    return StarShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<StarSpec, 'x' | 'y'>): Rect {
    return boundsOfStar(spec);
  }

  static scaleSpec(spec: Omit<StarSpec, 'x' | 'y'>, factor: number): Partial<StarSpec> {
    return scaleStar(spec, factor);
  }

  /**
   * Star vertices are placed symmetrically around the origin by
   * `starVertices`, so the local origin is the centroid. For odd-pointed
   * stars (5-point being the canonical case) the AABB midpoint is offset
   * from the visual mass — using the origin instead keeps an inset glyph
   * sitting where the eye reads as "centre".
   */
  override visualCenter(): Point {
    return { x: 0, y: 0 };
  }

  contains(localX: number, localY: number): boolean {
    return containsStar(this.spec, localX, localY);
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
    spec: Omit<StarSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const inset = style?.inset ?? 0;
    const base = starVertices(
      spec.points,
      Math.max(0, spec.innerRadius - inset),
      Math.max(0, spec.outerRadius - inset),
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

function computeVertices(spec: StarSpec, inset: number): Point[] {
  const inner = Math.max(0, spec.innerRadius - inset);
  const outer = Math.max(0, spec.outerRadius - inset);
  return starVertices(spec.points, inner, outer, spec.rotation ?? 0);
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
