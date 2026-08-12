/**
 * Spec paint → SVG paint attributes — the fill/stroke resolution shared by the
 * shape and connector serialisers, plus label-content extraction.
 *
 * Only the first `solid` fill layer is representable in flat SVG; `image` /
 * `glyph` / `svg` fills are skipped (→ `fill: none`) — a raster-only feature.
 */

import type { LabelContent, ShapeFill, ShapeStroke } from '@invana/canvas-store';
import { hexToCss, n } from './markup';

/**
 * Resolve a {@link ShapeFill} to SVG `fill` / `fill-opacity`. Only the first
 * `solid` layer is representable in flat SVG; `image` / `glyph` / `svg` fills
 * are skipped (→ `fill: none`), documented as a raster-only feature.
 */
export function fillPaint(fill: ShapeFill | undefined): Record<string, string | number | undefined> {
  if (fill === undefined) return { fill: 'none' };
  if (typeof fill === 'number') return { fill: hexToCss(fill) };
  const layers = Array.isArray(fill) ? fill : [fill];
  for (const layer of layers) {
    if (layer.kind === 'solid') {
      return { fill: hexToCss(layer.color), 'fill-opacity': layer.alpha ?? undefined };
    }
  }
  return { fill: 'none' };
}

/** Resolve a {@link ShapeStroke} to SVG stroke attributes. `widthScale` mirrors LOD scaling. */
export function strokePaint(stroke: ShapeStroke | undefined, widthScale = 1): Record<string, string | number | undefined> {
  if (!stroke) return {};
  const width = (stroke.width ?? 1) * widthScale;
  return {
    stroke: hexToCss(stroke.color),
    'stroke-width': width,
    'stroke-opacity': stroke.alpha ?? undefined,
    'stroke-linecap': stroke.cap,
    'stroke-linejoin': stroke.join,
    'stroke-dasharray': stroke.dashArray ? `${n(stroke.dashArray[0])} ${n(stroke.dashArray[1])}` : undefined,
    'stroke-dashoffset': stroke.dashOffset,
  };
}

/** Extract plain-text `LabelContent` from a label decoration style, if any. */
export function textContent(style: unknown): (LabelContent & { kind: 'text' }) | undefined {
  const content = (style as { content?: LabelContent } | undefined)?.content;
  return content?.kind === 'text' ? content : undefined;
}
