/**
 * `polygon` — primitive shape: filled / stroked closed polygon.
 *
 * `points` are in local coordinates relative to spec `(x, y)`. The polygon is
 * implicitly closed. Local bounds are the AABB of the supplied points.
 *
 * `rot` rotates points around the local origin before emit; vertices are
 * baked in.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, FillFit, FillInput, Point, Rect, ShapeKind } from '../types';
import { applyFill } from './textureMatrix';

export interface PolygonSpec extends BaseShapeSpec {
  readonly kind: 'polygon';
  readonly points: ReadonlyArray<Point>;
  readonly fill?: FillInput;
  readonly fillAlpha?: number;
  readonly fillFit?: FillFit;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export function drawPolygon(
  g: Graphics,
  spec: PolygonSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): void {
  if (spec.points.length < 3) return;
  const cx = spec.x + ox;
  const cy = spec.y + oy;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const transformed = spec.points.map((p) => ({
    x: cx + p.x * c - p.y * s,
    y: cy + p.x * s + p.y * c,
  }));
  g.poly(transformed);
  if (spec.fill !== undefined) {
    // Compute world-space AABB of transformed vertices for the texture matrix.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of transformed) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    applyFill(g, spec.fill, spec.fillAlpha, (minX + maxX) / 2, (minY + maxY) / 2, maxX - minX, maxY - minY, spec.fillFit);
  }
  if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
    });
  }
}

export function polygonBounds(spec: PolygonSpec): Rect {
  const pts = spec.points;
  if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = pts[0]!.x, minY = pts[0]!.y;
  let maxX = minX, maxY = minY;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Even-odd point-in-polygon test in local coordinates (pre-rotation). */
export function polygonContains(spec: PolygonSpec, lx: number, ly: number): boolean {
  const pts = spec.points;
  if (pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const pi = pts[i]!;
    const pj = pts[j]!;
    const intersect =
      pi.y > ly !== pj.y > ly &&
      lx < ((pj.x - pi.x) * (ly - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const polygonKind: ShapeKind<PolygonSpec> = {
  draw: drawPolygon,
  bounds: polygonBounds,
  contains: polygonContains,
};
