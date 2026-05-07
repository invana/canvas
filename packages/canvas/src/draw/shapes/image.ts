/**
 * `image` — primitive shape: textured rectangle drawn via `Graphics.texture()`.
 *
 * Convention: spec `(x, y)` is the **center**. The texture maps to the rect
 * `(-width/2, -height/2)` → `(width/2, height/2)` in local space.
 *
 * Texture lifecycle is the caller's responsibility — pass a preloaded Pixi
 * `Texture` (e.g. via `Assets.load`). The primitive does not destroy textures
 * on shape destroy; they may be cached/shared by the caller's asset pipeline.
 *
 * `rot` is currently axis-aligned only (Pixi's `Graphics.texture` doesn't
 * accept rotation). For rotated images, a future addition can use a textured
 * polygon via `g.fill({ texture, matrix })`.
 */

import type { Graphics, Texture } from 'pixi.js';
import type { BaseShapeSpec, Rect, ShapeKind } from '../types';

export interface ImageSpec extends BaseShapeSpec {
  readonly kind: 'image';
  readonly texture: Texture;
  readonly width: number;
  readonly height: number;
  /** Multiplicative tint; `0xffffff` for none. Default `0xffffff`. */
  readonly tint?: number;
}

export function drawImage(
  g: Graphics,
  spec: ImageSpec,
  ox: number = 0,
  oy: number = 0,
  _rot: number = 0,
): void {
  const w = spec.width;
  const h = spec.height;
  g.texture(spec.texture, spec.tint ?? 0xffffff, spec.x + ox - w / 2, spec.y + oy - h / 2, w, h);
}

export function imageBounds(spec: ImageSpec): Rect {
  return {
    x: -spec.width / 2,
    y: -spec.height / 2,
    width: spec.width,
    height: spec.height,
  };
}

export const imageKind: ShapeKind<ImageSpec> = {
  draw: drawImage,
  bounds: imageBounds,
};
