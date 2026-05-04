/**
 * `rect` — primitive shape: filled / stroked rectangle, optional rounded corners.
 *
 * Convention: spec `(x, y)` is the **center**. `width` × `height` are the full
 * extents. Local-space bounds: `{ x: -w/2, y: -h/2, width, height }`.
 *
 * `rot` rotates the rectangle around its center. Vertices are baked into the
 * emitted geometry — no Container transform.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, Rect, ShapeKind } from '../types';

export interface RectSpec extends BaseShapeSpec {
  readonly kind: 'rect';
  readonly width: number;
  readonly height: number;
  readonly cornerRadius?: number;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export function drawRect(
  g: Graphics,
  spec: RectSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): void {
  const halfW = spec.width / 2;
  const halfH = spec.height / 2;
  const radius = spec.cornerRadius ?? 0;

  const cx = spec.x + ox;
  const cy = spec.y + oy;
  if (rot === 0) {
    if (radius > 0) {
      g.roundRect(cx - halfW, cy - halfH, spec.width, spec.height, radius);
    } else {
      g.rect(cx - halfW, cy - halfH, spec.width, spec.height);
    }
  } else {
    // Rotated: build the polygon manually. Rounded corners are dropped at
    // arbitrary rotations (caller can use a path shape if they need both).
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const corners = [
      { x: -halfW, y: -halfH },
      { x:  halfW, y: -halfH },
      { x:  halfW, y:  halfH },
      { x: -halfW, y:  halfH },
    ].map((p) => ({ x: cx + p.x * c - p.y * s, y: cy + p.x * s + p.y * c }));
    g.poly(corners);
  }

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

export function rectBounds(spec: RectSpec): Rect {
  return {
    x: -spec.width / 2,
    y: -spec.height / 2,
    width: spec.width,
    height: spec.height,
  };
}

export const rectKind: ShapeKind<RectSpec> = {
  draw: drawRect,
  bounds: rectBounds,
};
