/**
 * `star` — primitive shape: filled / stroked n-pointed star.
 *
 * Convention: spec `(x, y)` is the center. The star has `points` outer tips,
 * with `2 * points` total vertices alternating between `outerRadius` and
 * `innerRadius`. The first outer tip points along `-y` (straight up) before
 * `rot` is applied. `rot` rotates the entire glyph around the center.
 *
 * `cornerRadius` fillets each vertex (outer tips and inner notches) with arcs;
 * per-vertex radius is auto-capped by half the shorter adjacent edge length.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, FillFit, FillInput, Point, Rect, ShapeKind } from '../types';
import { applyFill } from './textureMatrix';
import { drawRoundedPoly } from './_polyUtils';

export interface StarSpec extends BaseShapeSpec {
  readonly kind: 'star';
  /** Number of outer tips (5 = standard star). Min 3. */
  readonly points: number;
  /** Distance from center to each outer tip. */
  readonly outerRadius: number;
  /** Distance from center to each inner notch. */
  readonly innerRadius: number;
  /** Vertex fillet radius. Default `0` (sharp). */
  readonly cornerRadius?: number;
  readonly fill?: FillInput;
  readonly fillAlpha?: number;
  readonly fillFit?: FillFit;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

function starVertices(spec: StarSpec, ox = 0, oy = 0, rot = 0): Point[] {
  const n = Math.max(3, spec.points | 0);
  const cx = spec.x + ox;
  const cy = spec.y + oy;
  const step = Math.PI / n;
  const verts: Point[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 === 0 ? spec.outerRadius : spec.innerRadius;
    const a = -Math.PI / 2 + i * step + rot;
    verts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return verts;
}

export function drawStar(
  g: Graphics,
  spec: StarSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): void {
  if (spec.points < 3) return;
  const verts = starVertices(spec, ox, oy, rot);
  drawRoundedPoly(g, verts, spec.cornerRadius ?? 0);

  if (spec.fill !== undefined) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of verts) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    applyFill(
      g,
      spec.fill,
      spec.fillAlpha,
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      maxX - minX,
      maxY - minY,
      spec.fillFit,
    );
  }
  if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
    });
  }
}

export function starBounds(spec: StarSpec): Rect {
  const r = spec.outerRadius;
  return { x: -r, y: -r, width: 2 * r, height: 2 * r };
}

/** Even-odd point-in-polygon test in local coordinates (pre-rotation). */
export function starContains(spec: StarSpec, lx: number, ly: number): boolean {
  if (spec.points < 3) return false;
  const local = starVertices({ ...spec, x: 0, y: 0 });
  let inside = false;
  for (let i = 0, j = local.length - 1; i < local.length; j = i++) {
    const pi = local[i]!;
    const pj = local[j]!;
    const intersect =
      pi.y > ly !== pj.y > ly &&
      lx < ((pj.x - pi.x) * (ly - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const starKind: ShapeKind<StarSpec> = {
  draw: drawStar,
  bounds: starBounds,
  contains: starContains,
};
