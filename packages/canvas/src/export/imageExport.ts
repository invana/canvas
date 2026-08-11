/**
 * Raster export — turn the canvas viewport (or the whole diagram) into a
 * PNG / JPEG / WebP image.
 *
 * **How it works.** PixiJS is a GPU raster renderer, so there is no vector
 * scene to serialise — we ask the renderer's `extract` system to render a
 * chosen region of the {@link Canvas.world} container into an offscreen
 * `<canvas>`, then (optionally) composite it onto a background fill and hand
 * back a `Blob` / data URL.
 *
 * Both capture areas render the **world** container (never `stage`), so
 * screen-glued overlays (minimap, dev-info, the background layer) are excluded
 * — the background is reproduced by us via the {@link ExportImageOptions.background}
 * option, giving consistent, overlay-free output in both modes:
 *
 * - `area: 'viewport'` — the world region currently visible, rendered at the
 *   on-screen zoom (`resolution = camera.scale × scale`). WYSIWYG minus overlays.
 * - `area: 'content'` — the union bounds of all world content at 1:1 native
 *   scale (`resolution = scale`), independent of the current camera. Exports the
 *   whole diagram even when most of it is off-screen.
 *
 * SVG is intentionally *not* handled here — a true vector exporter is a separate
 * projection of the store (Phase 2), not something `extract` can produce.
 */

import type { Canvas } from '../engine/Canvas';
import {
  captureRect,
  resolveExportBackground,
  type ExportArea,
  type ExportBackground,
} from './shared';

export type { ExportArea, ExportBackground } from './shared';

/** Raster formats `extract` + `HTMLCanvasElement.toBlob` can emit. */
export type ExportRasterFormat = 'png' | 'jpeg' | 'webp';

/** Options for {@link Canvas.export} / {@link Canvas.exportDataURL}. */
export interface ExportImageOptions {
  /** Output format. Default `'png'`. `'svg'` routes to the vector exporter. */
  format?: ExportRasterFormat | 'svg';
  /** Capture area. Default `'viewport'`. */
  area?: ExportArea;
  /** Background fill. Default `'canvas'`. See {@link ExportBackground}. */
  background?: ExportBackground;
  /**
   * Force a specific output aspect ratio (width ÷ height, e.g. `16/9`, `1`).
   * The capture region is letterboxed to it — grown + re-centred, never
   * cropped — with the background filling the added margin. Default: no
   * constraint (the region's natural ratio).
   */
  aspectRatio?: number;
  /**
   * Resolution multiplier applied on top of the mode's base resolution.
   * Default = `window.devicePixelRatio` (≥ 1). Bump it for a higher-DPI export;
   * the result is clamped by {@link maxSize}.
   */
  scale?: number;
  /** Encoder quality `0..1` for `'jpeg'` / `'webp'`. Ignored for `'png'`. */
  quality?: number;
  /** Extra world-space padding around the content bounds (`area: 'content'` only). Default `24`. */
  padding?: number;
  /**
   * Clamp for the longest output edge in pixels — guards against exceeding the
   * GPU's max texture size on huge/zoomed exports. When the request would
   * exceed it, the resolution is scaled down to fit. Default `8192`.
   */
  maxSize?: number;
}

/** MIME type for a given raster export format. */
function mimeFor(format: ExportRasterFormat): string {
  return format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
}

/** Coerce the (possibly `'svg'`) option to a concrete raster format. */
function rasterFormat(format: ExportImageOptions['format']): ExportRasterFormat {
  return format === 'jpeg' || format === 'webp' ? format : 'png';
}

/**
 * Render the requested region of the world into an offscreen `<canvas>`,
 * compositing the background fill. Shared by {@link exportImage} (→ `Blob`) and
 * {@link exportImageDataURL} (→ data URL). Throws when no GPU renderer is
 * available (headless) or when there is nothing to export.
 */
function renderToCanvas(canvas: Canvas, opts: ExportImageOptions): HTMLCanvasElement {
  const format = rasterFormat(opts.format);
  const area = opts.area ?? 'viewport';
  const maxSize = opts.maxSize ?? 8192;
  const userScale =
    opts.scale ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  const renderer = canvas.renderer;
  if (!renderer?.extract) {
    throw new Error('Canvas.export: a GPU renderer is required (unavailable in headless mode).');
  }

  // Region + base resolution per mode. `frame` is in world-local coordinates
  // (the world container's own space, pre-camera-transform), which is what
  // `captureRect` returns. `viewport` renders at the on-screen zoom; `content`
  // renders at native 1:1 (× userScale).
  const frame = captureRect(canvas, area, opts.padding ?? 24, opts.aspectRatio);
  let resolution = area === 'content' ? userScale : canvas.camera.scale * userScale;

  if (!(frame.width > 0) || !(frame.height > 0)) {
    throw new Error('Canvas.export: nothing to export (empty capture region).');
  }

  // Clamp the longest output edge to `maxSize` so we never ask for a texture
  // bigger than the GPU allows.
  const longest = Math.max(frame.width, frame.height) * resolution;
  if (longest > maxSize) resolution *= maxSize / longest;

  // Extract onto a fully-transparent clear so we control the background
  // ourselves below (keeps 'transparent' honest and the composite uniform).
  const extracted = renderer.extract({ region: frame, resolution });

  const bg = resolveExportBackground(canvas, opts.background ?? 'canvas');
  // JPEG cannot store alpha; a transparent request would render black, so fall
  // back to white. PNG/WebP with a transparent background need no compositing.
  const needsFill = bg !== null || format === 'jpeg';
  if (!needsFill) return extracted;

  const out = document.createElement('canvas');
  out.width = extracted.width;
  out.height = extracted.height;
  const g = out.getContext('2d');
  if (!g) throw new Error('Canvas.export: 2D context unavailable for background composite.');
  g.fillStyle = bg ?? '#ffffff';
  g.fillRect(0, 0, out.width, out.height);
  g.drawImage(extracted, 0, 0);
  return out;
}

/**
 * Export the canvas as an image `Blob`. See {@link ExportImageOptions}.
 * Rejects when no GPU renderer is available or the region is empty.
 */
export function exportImage(canvas: Canvas, opts: ExportImageOptions = {}): Promise<Blob> {
  const el = renderToCanvas(canvas, opts);
  const mime = mimeFor(rasterFormat(opts.format));
  return new Promise<Blob>((resolve, reject) => {
    el.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas.export: toBlob() returned null.'))),
      mime,
      opts.quality,
    );
  });
}

/**
 * Export the canvas as a `data:` URL. Synchronous counterpart to
 * {@link exportImage} — handy for `<img src>` / quick previews. Prefer
 * {@link exportImage} for downloads (a `Blob` URL avoids a large base64 string).
 */
export function exportImageDataURL(canvas: Canvas, opts: ExportImageOptions = {}): string {
  const el = renderToCanvas(canvas, opts);
  return el.toDataURL(mimeFor(rasterFormat(opts.format)), opts.quality);
}
