import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import {
  offsetPolygon,
  pointInPolygon,
  polygonBounds,
  rayPolygonIntersection,
} from './_polyUtils';
import type {
  Point,
  PolygonSpec,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Free-form polygon. Vertices are centre-relative — the silhouette is traced
 * around the origin in shape-local space and the `gfx` Container translates
 * the result to `(spec.x, spec.y)`. The polygon is treated as closed: the
 * trace returns to the first vertex automatically.
 */
export class PolygonShape extends ShapeBase<PolygonSpec> {
  static readonly kind = 'polygon';

  constructor(spec: PolygonSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: PolygonSpec, style?: ShapePaintStyle): void {
    const verts = resolveVertices(spec.vertices, style?.inset ?? 0);
    if (verts.length < 3) return;

    if (style?.dashArray) {
      emitDashedStroke(g, verts, {
        color: style.color ?? 0x000000,
        alpha: style.alpha ?? 1,
        width: style.strokeWidth ?? 1,
        dashArray: style.dashArray,
        dashOffset: style.dashOffset,
        closed: true,
      });
      return;
    }

    const trace = () => tracePolygon(g, verts);
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    trace();
    applyStroke(g, spec, style);
  }

  bounds(): Rect {
    return polygonBounds(this.spec.vertices);
  }

  /**
   * Vertices are authored centre-relative, so the local origin is the
   * natural visual centre. Returning `(0, 0)` instead of the AABB midpoint
   * keeps inset glyphs / icons sitting where the user expects when the
   * polygon's silhouette doesn't fill its AABB (e.g. the chevron's notch
   * leaves empty space on the left of the box).
   */
  override visualCenter(): Point {
    return { x: 0, y: 0 };
  }

  contains(localX: number, localY: number): boolean {
    return pointInPolygon(localX, localY, this.spec.vertices);
  }

  /**
   * Analytical ray-to-edge intersection. Polygon vertices are already
   * centre-relative, so `localFromCenter` shares the same frame as the
   * stored vertices.
   */
  override boundaryIntersect(localFromCenter: Point): Point | null {
    return rayPolygonIntersection(localFromCenter, this.spec.vertices);
  }

  /**
   * Silhouette obstacle-test for routers. Translates the world point into
   * shape-local space and runs an even-odd point-in-polygon test against the
   * polygon expanded by `inflate`. Tight against the actual silhouette
   * instead of the AABB, so routes hug concave / angular outlines.
   */
  obstacleTest(): (worldX: number, worldY: number, inflate: number) => boolean {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const baseVerts = this.spec.vertices;
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

  /**
   * Marker paint surface. Rotates the vertex list by `angleRad`, translates
   * to `anchor`, then traces + fills. Only the first solid layer of
   * `spec.fill` is honoured (markers don't support image / inset fills).
   */
  static paintInto(
    g: Graphics,
    spec: Omit<PolygonSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const verts = resolveVertices(spec.vertices, style?.inset ?? 0);
    if (verts.length < 3) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed: Point[] = verts.map((v) => ({
      x: anchor.x + v.x * cos - v.y * sin,
      y: anchor.y + v.x * sin + v.y * cos,
    }));
    tracePolygon(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
}

function resolveVertices(
  vertices: ReadonlyArray<Point>,
  inset: number,
): ReadonlyArray<Point> {
  if (inset === 0) return vertices;
  return offsetPolygon(vertices, inset);
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
