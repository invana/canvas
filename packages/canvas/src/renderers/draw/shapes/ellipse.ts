/**
 * `ellipse` — primitive shape: filled / stroked ellipse.
 *
 * Convention: spec `(x, y)` is the center; `(rx, ry)` are the half-axes.
 * Local-space bounds: `{ x: -rx, y: -ry, width: 2rx, height: 2ry }`.
 *
 * `rot` is accepted but currently emits an axis-aligned ellipse (Pixi's
 * `g.ellipse` doesn't support rotation directly — for rotated ellipses the
 * caller can use a `path` shape with cubic curves).
 *
 * `fill` accepts a solid color (`number`) or a `Texture`. When a texture is
 * supplied it is stretched to fill the ellipse's bounding box — the ellipse
 * geometry acts as the clip mask.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, FillFit, FillInput, Rect, ShapeKind } from '../types';
import { applyFill } from './textureMatrix';

export interface EllipseSpec extends BaseShapeSpec {
  readonly kind: 'ellipse';
  readonly rx: number;
  readonly ry: number;
  readonly fill?: FillInput;
  readonly fillAlpha?: number;
  readonly fillFit?: FillFit;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export function drawEllipse(
  g: Graphics,
  spec: EllipseSpec,
  ox: number = 0,
  oy: number = 0,
  _rot: number = 0,
): void {
  const cx = spec.x + ox;
  const cy = spec.y + oy;
  g.ellipse(cx, cy, spec.rx, spec.ry);
  if (spec.fill !== undefined) {
    applyFill(g, spec.fill, spec.fillAlpha, cx, cy, spec.rx * 2, spec.ry * 2, spec.fillFit);
  }
  if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
    });
  }
}

export function ellipseBounds(spec: EllipseSpec): Rect {
  return { x: -spec.rx, y: -spec.ry, width: spec.rx * 2, height: spec.ry * 2 };
}

export function ellipseContains(spec: EllipseSpec, lx: number, ly: number): boolean {
  if (spec.rx === 0 || spec.ry === 0) return false;
  const nx = lx / spec.rx;
  const ny = ly / spec.ry;
  return nx * nx + ny * ny <= 1;
}

export const ellipseKind: ShapeKind<EllipseSpec> = {
  draw: drawEllipse,
  bounds: ellipseBounds,
  contains: ellipseContains,
};
