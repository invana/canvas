/**
 * `circle` — primitive shape: filled / stroked disc.
 *
 * Convention: spec `(x, y)` is the **center**. Local-space bounds are
 * `{ x: -r, y: -r, width: 2r, height: 2r }`. Rotation-invariant; `rot`
 * is accepted but ignored.
 *
 * `fill` accepts a solid color (`number`) or a `Texture`. When a texture is
 * supplied it is stretched to fill the circle's bounding box — the circle
 * geometry acts as the clip mask. Use this to render image-avatars, icon
 * nodes, etc. without a separate masking display object.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, FillFit, FillInput, Rect, ShapeKind } from '../types';
import { applyFill } from './textureMatrix';

export interface CircleSpec extends BaseShapeSpec {
  readonly kind: 'circle';
  readonly r: number;
  readonly fill?: FillInput;
  readonly fillAlpha?: number;
  readonly fillFit?: FillFit;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export function drawCircle(
  g: Graphics,
  spec: CircleSpec,
  ox: number = 0,
  oy: number = 0,
  _rot: number = 0,
): void {
  const cx = spec.x + ox;
  const cy = spec.y + oy;
  const size = spec.r * 2;
  g.circle(cx, cy, spec.r);
  if (spec.fill !== undefined) {
    applyFill(g, spec.fill, spec.fillAlpha, cx, cy, size, size, spec.fillFit);
  }
  if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
    });
  }
}

export function circleBounds(spec: CircleSpec): Rect {
  return { x: -spec.r, y: -spec.r, width: spec.r * 2, height: spec.r * 2 };
}

export function circleContains(spec: CircleSpec, lx: number, ly: number): boolean {
  return lx * lx + ly * ly <= spec.r * spec.r;
}

export const circleKind: ShapeKind<CircleSpec> = {
  draw: drawCircle,
  bounds: circleBounds,
  contains: circleContains,
};
