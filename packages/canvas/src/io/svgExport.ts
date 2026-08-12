/**
 * Vector SVG export — a **second projection** of the scene into scalable SVG
 * markup, independent of the GPU raster path.
 *
 * PixiJS renders to WebGPU/WebGL, so there is no vector output to read back;
 * instead we serialise the **live specs** the renderer already holds — each
 * shape's geometry spec and each connector's routed `Path` — into SVG
 * elements. Because those are the exact specs on screen, the SVG matches the
 * rendered diagram, while staying resolution independent.
 *
 * The per-spec serialisers (`shapeSpecToSvg` / `connectorToSvg` / `pathToSvgD`)
 * are **pure and domain-free** and live in `@invana/canvas-core`'s `svg/` —
 * `PrimitivesRenderer.toSVG` walks its instance maps and calls them without
 * touching the engine. This module keeps only {@link exportSVG}: the document
 * assembler that walks a live {@link Canvas} and stitches every layer's
 * fragment into one `<svg>` with the right `viewBox` + background.
 */

import type { Canvas } from '../engine/Canvas';
import { attrs, svgNum as n } from '@invana/canvas-core';
import { hexToCss, resolveExportBackground, captureRect, type ExportArea } from './shared';

// Re-exported for back-compat: these were declared here before the serialisers
// moved to `@invana/canvas-core`; the engine root keeps exporting them.
export { connectorToSvg, pathToSvgD, shapeSpecToSvg } from '@invana/canvas-core';
export { hexToCss };

/** Options for {@link Canvas.exportSVG} (a subset of the raster options). */
export interface ExportSvgOptions {
  /** Capture area. Default `'viewport'`. */
  area?: ExportArea;
  /** Background fill. Default `'canvas'`. `'transparent'` omits the backing rect. */
  background?: string | number | 'transparent' | 'canvas';
  /** World padding around the content bounds (`area: 'content'` only). Default `24`. */
  padding?: number;
  /**
   * Force a specific output aspect ratio (width ÷ height). The `viewBox` is
   * letterboxed to it — grown + re-centred, never cropped. Default: no constraint.
   */
  aspectRatio?: number;
  /** Multiplier for the SVG's pixel `width`/`height` attributes (the `viewBox` is unaffected). Default `1`. */
  scale?: number;
}

/** A layer that can contribute vector markup to an SVG export. */
export interface SvgExportableLayer {
  /** Return an SVG fragment (elements, no `<svg>` wrapper) in world coordinates. */
  toSVG(): string;
}

/**
 * Build the full SVG document for a canvas. Walks visible layers in z-order,
 * collects each {@link SvgExportableLayer.toSVG} fragment, and wraps them in an
 * `<svg>` sized to the capture region with an optional background rect.
 *
 * Throws when the capture region is empty (nothing to export).
 */
export function exportSVG(canvas: Canvas, opts: ExportSvgOptions = {}): string {
  const area = opts.area ?? 'viewport';
  const rect = captureRect(canvas, area, opts.padding ?? 24, opts.aspectRatio);
  if (!(rect.width > 0) || !(rect.height > 0)) {
    throw new Error('Canvas.exportSVG: nothing to export (empty capture region).');
  }

  const body: string[] = [];
  for (const layer of canvas.layers.byZOrder()) {
    if (!layer.visible) continue;
    const fn = (layer as unknown as Partial<SvgExportableLayer>).toSVG;
    if (typeof fn === 'function') {
      const frag = fn.call(layer);
      if (frag) body.push(frag);
    }
  }

  const bg = resolveExportBackground(canvas, opts.background ?? 'canvas');
  const bgRect = bg
    ? `<rect ${attrs({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, fill: bg })}/>`
    : '';

  // viewBox is world units; pixel width/height reproduce on-screen size for the
  // viewport area (× camera zoom), native size for content.
  const pxScale = (area === 'viewport' ? canvas.camera.scale : 1) * (opts.scale ?? 1);
  const header = attrs({
    xmlns: 'http://www.w3.org/2000/svg',
    width: rect.width * pxScale,
    height: rect.height * pxScale,
    viewBox: `${n(rect.x)} ${n(rect.y)} ${n(rect.width)} ${n(rect.height)}`,
  });
  return `<svg ${header}>${bgRect}${body.join('')}</svg>`;
}
