/**
 * `circle` — primitive shape: filled / stroked disc.
 *
 * Convention: spec `(x, y)` is the **center**. Local-space bounds are
 * `{ x: -r, y: -r, width: 2r, height: 2r }`. Rotation-invariant; `rot`
 * is accepted but ignored.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, Rect, ShapeKind } from '../types';

export interface CircleSpec extends BaseShapeSpec {
  readonly kind: 'circle';
  readonly r: number;
  readonly fill?: number;
  readonly fillAlpha?: number;
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
  g.circle(spec.x + ox, spec.y + oy, spec.r);
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
