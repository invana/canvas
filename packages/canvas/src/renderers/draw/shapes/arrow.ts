/**
 * `arrow` — primitive shape: filled / stroked triangular arrow head.
 *
 * Convention: tip anchored at spec `(x, y)`; in local space the tip is at
 * `(0, 0)` and the tail is at `x = -size`. The arrow points along `+x`
 * before rotation; `rot` rotates the entire glyph around the tip.
 *
 * Used as a marker by layers that compose connectors with arrowheads —
 * the layer reads the connector's polyline tangent at the desired endpoint
 * and passes it as `rot`. This shape itself knows nothing about connectors.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, Rect, ShapeKind } from '../types';

export interface ArrowSpec extends BaseShapeSpec {
  readonly kind: 'arrow';
  /** Total length, tip → tail. */
  readonly size: number;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export function drawArrow(
  g: Graphics,
  spec: ArrowSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): void {
  const s = spec.size;
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const ax = spec.x + ox;
  const ay = spec.y + oy;
  const tip   = { x: ax, y: ay };
  const tail1 = { x: ax + (-s) * c - (-s / 2) * sn, y: ay + (-s) * sn + (-s / 2) * c };
  const tail2 = { x: ax + (-s) * c - ( s / 2) * sn, y: ay + (-s) * sn + ( s / 2) * c };
  g.poly([tip, tail1, tail2]);

  if (spec.fill !== undefined) {
    g.fill({ color: spec.fill, alpha: spec.fillAlpha ?? 1 });
  } else {
    // Default fill so a bare `{ kind: 'arrow', size }` produces a visible glyph.
    g.fill({ color: 0x000000, alpha: 1 });
  }
  if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
    });
  }
}

export function arrowBounds(spec: ArrowSpec): Rect {
  return { x: -spec.size, y: -spec.size / 2, width: spec.size, height: spec.size };
}

export const arrowKind: ShapeKind<ArrowSpec> = {
  draw: drawArrow,
  bounds: arrowBounds,
};
