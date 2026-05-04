/**
 * Texture-fill helpers for shape draw functions.
 *
 * `textureMatrix` computes the PixiJS `Matrix` that maps local vertex
 * coordinates to texture pixel coordinates, implementing CSS-style object-fit
 * behaviour for the four supported fit modes.
 *
 * `applyFill` is a drop-in replacement for the inline `g.fill({ color })`
 * call used by every shape draw function. It handles both solid-color fills
 * and texture fills uniformly — callers don't need to branch on fill type.
 *
 * Relationship to the draw module contract:
 *   - Both functions are pure: no display objects created, no state mutated.
 *   - `applyFill` must be called immediately after the geometry definition
 *     (the same `g.circle(...)` / `g.rect(...)` etc.) so PixiJS applies the
 *     fill to the correct path.
 *
 * ## Fit mode math
 *
 * The Matrix maps a local vertex `(x, y)` → texture pixel `(u, v)` via
 * `u = sx*x + tx`, `v = sy*y + ty`.
 *
 * For all aspect-ratio-preserving modes (`cover`, `none`, `scale-down`):
 *   `sx = sy = 1/scale`
 *   `tx = texW/2 - cx*sx`
 *   `ty = texH/2 - cy*sy`
 *
 * Where `scale` is the display-to-texture pixel ratio:
 *   - `cover`      → `max(w/texW, h/texH)` — zoom in until both axes covered
 *   - `none`       → `1` — one display unit = one texture pixel
 *   - `scale-down` → `min(1, w/texW, h/texH)` — never upscale
 *
 * For `fill` (non-uniform):
 *   `sx = texW/w`, `sy = texH/h` (each axis scaled independently)
 *   `tx = texW/2 - cx*sx`, `ty = texH/2 - cy*sy`
 */

import { Matrix, type Texture } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import type { FillFit, FillInput } from '../types';

/**
 * Build a `Matrix` that maps local-space vertex coordinates to texture pixel
 * coordinates according to the given fit mode.
 *
 * `(cx, cy)` is the center of the shape's bounding box in the same local space
 * the draw function uses. `(w, h)` are the full extents of that bounding box.
 */
export function textureMatrix(
  texture: Texture,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fit: FillFit = 'fill',
): Matrix {
  const texW = texture.width;
  const texH = texture.height;
  let sx: number;
  let sy: number;

  if (fit === 'fill') {
    // Non-uniform: each axis stretched independently.
    sx = texW / w;
    sy = texH / h;
  } else {
    const scale =
      fit === 'cover'
        ? Math.max(w / texW, h / texH)   // zoom in to cover
        : fit === 'none'
        ? 1                               // natural pixel size
        : Math.min(1, w / texW, h / texH); // scale-down: contain, never upscale
    sx = sy = 1 / scale;
  }

  return new Matrix(sx, 0, 0, sy, texW / 2 - cx * sx, texH / 2 - cy * sy);
}

/**
 * Apply a fill to the most recently defined Graphics path.
 *
 * - `number` fill  → solid color, respects `alpha`. `fit` is ignored.
 * - `Texture` fill → texture sized to `(cx, cy, w, h)` per `fit`, respects `alpha`.
 *
 * Must be called immediately after the path definition, before any other
 * Graphics call.
 */
export function applyFill(
  g: Graphics,
  fill: FillInput,
  alpha: number | undefined,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fit?: FillFit,
): void {
  if (typeof fill === 'number') {
    g.fill({ color: fill, alpha: alpha ?? 1 });
  } else {
    g.fill({
      texture: fill,
      matrix: textureMatrix(fill, cx, cy, w, h, fit ?? 'fill'),
      alpha: alpha ?? 1,
    });
  }
}
