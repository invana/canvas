/**
 * `PolygonShape` — built-in primitive registered as kind `'polygon'`.
 *
 * The spec carries an array of `points` in **local coordinates** relative to
 * the spec's `(x, y)` origin (which acts as the polygon's anchor — typically
 * its centroid, but the caller decides). Local bounds are the AABB of the
 * supplied points; the renderer translates by `(spec.x, spec.y)` for the
 * world-space hit index. The polygon is implicitly closed.
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseShapeSpec, IShape, Point, Rect, ShapeHostInfo, ShapePaintStyle } from '../types';

export interface PolygonShapeSpec extends BaseShapeSpec {
  readonly kind: 'polygon';
  readonly points: ReadonlyArray<Point>;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class PolygonShape implements IShape<PolygonShapeSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private currentBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private currentPoints: ReadonlyArray<Point> = [];

  constructor(_spec: PolygonShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'shape:polygon';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: PolygonShapeSpec): void {
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    this.currentBounds = computeAABB(spec.points);
    this.currentPoints = spec.points;

    const g = this.graphics;
    g.clear();
    if (spec.points.length >= 3) {
      g.poly(spec.points.map((p) => ({ x: p.x, y: p.y })));
      if (spec.fill !== undefined) {
        g.fill({ color: spec.fill, alpha: spec.fillAlpha ?? 1 });
      }
      if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
        g.stroke({
          color: spec.stroke,
          width: spec.strokeWidth ?? 1,
          alpha: spec.strokeAlpha ?? 1,
        });
      }
    }
  }

  bounds(): Rect {
    return this.currentBounds;
  }

  /**
   * Even-odd point-in-polygon. Walks each edge and toggles `inside` whenever
   * a horizontal ray cast right of `(localX, localY)` crosses it. Robust
   * enough for the mostly-convex shapes Layers will hand it; for stress-
   * level concave polygons add a domain-specific shape with a more careful
   * implementation.
   */
  contains(localX: number, localY: number): boolean {
    const pts = this.currentPoints;
    if (pts.length < 3) return false;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const pi = pts[i]!;
      const pj = pts[j]!;
      const intersect =
        pi.y > localY !== pj.y > localY &&
        localX < ((pj.x - pi.x) * (localY - pi.y)) / (pj.y - pi.y) + pi.x;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /**
   * Paint a `PolygonShapeSpec` into a caller-supplied `Graphics`, with each
   * point rotated by `angleRad` around the origin and translated by `anchor`.
   * `style` overrides spec colour/alpha.
   */
  static paintInto(
    g: Graphics,
    spec: Omit<PolygonShapeSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    if (spec.points.length < 3) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const transformed: Point[] = spec.points.map((p) => ({
      x: anchor.x + p.x * cos - p.y * sin,
      y: anchor.y + p.x * sin + p.y * cos,
    }));
    g.poly(transformed);
    const fillColor = style?.color ?? spec.fill;
    if (fillColor !== undefined) {
      g.fill({ color: fillColor, alpha: style?.alpha ?? spec.fillAlpha ?? 1 });
    }
    if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
      g.stroke({
        color: style?.color ?? spec.stroke,
        width: spec.strokeWidth ?? 1,
        alpha: style?.alpha ?? spec.strokeAlpha ?? 1,
      });
    }
  }
}

function computeAABB(points: ReadonlyArray<Point>): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = points[0]!.x;
  let minY = points[0]!.y;
  let maxX = minX;
  let maxY = minY;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
