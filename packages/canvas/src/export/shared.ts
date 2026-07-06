/**
 * Shared helpers for the raster ({@link ./imageExport}) and vector
 * ({@link ./svgExport}) export paths — colour conversion, background
 * resolution, and the capture-region rectangle.
 */

import type { Canvas } from '../engine/Canvas';
import type { Rect } from '../camera/Camera';

/**
 * Background fill for an exported image / SVG:
 * - `'transparent'` — no fill (alpha PNG/WebP/SVG; JPEG falls back to white).
 * - `'canvas'` — match the on-screen canvas background (resolved from the
 *   background layer / active theme surface / `CanvasOptions.backgroundColor`).
 * - a hex `number` (`0xRRGGBB`) or any CSS colour `string`.
 */
export type ExportBackground = 'transparent' | 'canvas' | number | string;

/** Which region of the diagram to capture. */
export type ExportArea = 'viewport' | 'content';

/** `0xRRGGBB` → `#rrggbb`. */
export function hexToCss(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
}

/**
 * Resolve an {@link ExportBackground} to a concrete CSS colour string, or
 * `null` for a transparent (no-fill) background.
 */
export function resolveExportBackground(canvas: Canvas, bg: ExportBackground): string | null {
  if (bg === 'transparent') return null;
  if (typeof bg === 'number') return hexToCss(bg);
  if (typeof bg === 'string' && bg !== 'canvas') return bg;

  // `'canvas'` (or default) — mirror the on-screen background. Prefer a live
  // background layer's resolved colour (most faithful), then the active theme's
  // `surface` role, then the construction-time `backgroundColor`, else transparent.
  for (const layer of canvas.layers.byZOrder()) {
    const getter = (layer as { getResolvedBackgroundColor?: () => number | string })
      .getResolvedBackgroundColor;
    if (typeof getter === 'function') {
      const c = getter.call(layer);
      return typeof c === 'number' ? hexToCss(c) : c;
    }
  }
  const surface = canvas.context?.theme?.current?.()?.palette?.surface;
  if (typeof surface === 'number') return hexToCss(surface);
  const optColor = canvas.options.backgroundColor;
  return typeof optColor === 'number' ? hexToCss(optColor) : null;
}

/**
 * The world-space rectangle to capture for the given area:
 * - `'content'` — the union bounds of everything in the world container, grown
 *   by `padding` world units.
 * - `'viewport'` — the region currently visible through the camera.
 */
export function captureRect(canvas: Canvas, area: ExportArea, padding = 24): Rect {
  if (area === 'content') {
    const b = canvas.world.getLocalBounds();
    return {
      x: b.minX - padding,
      y: b.minY - padding,
      width: b.width + padding * 2,
      height: b.height + padding * 2,
    };
  }
  return canvas.camera.getVisibleBounds();
}
