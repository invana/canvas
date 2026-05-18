/**
 * Fill + stroke resolution for `ShapeBase` subclasses.
 *
 * `drawGeometry` traces the silhouette into a `Graphics` once (the initial
 * trace), then calls `applyFill(g, spec, style, host, retrace)` followed by
 * a re-trace and `applyStroke(g, spec, style)`. When `style` is supplied
 * (decoration override) it takes precedence over `spec.fill` / `spec.stroke`.
 *
 * Layered fills: `spec.fill` may be a single layer or an array. This module
 * iterates only **silhouette-filler** layer kinds — `solid` and `image` —
 * painting each into the silhouette via `g.fill()`. Image layers always
 * paint with CSS-`cover` semantics (uniform scale, may crop). Multiple
 * silhouette layers are supported — each is re-traced before painting
 * (Pixi's `fill` consumes the most recent path). **Inset-content** layers
 * (`glyph`, `svg`, `svg-url`) are handled separately by
 * `ShapeBase.syncInsetLayers` / `insetContentLayer.ts` — they're skipped
 * here.
 */

import { Matrix, type Graphics, type Texture } from 'pixi.js';
import type {
  BaseShapeSpec,
  Rect,
  ShapeFill,
  ShapeFillLayer,
  ShapeHostInfo,
  ShapePaintStyle,
  ShapeStroke,
} from '../types';

type SilhouetteLayer = Extract<ShapeFillLayer, { kind: 'solid' | 'image' }>;

export function applyFill(
  g: Graphics,
  spec: BaseShapeSpec,
  style: ShapePaintStyle | undefined,
  host: ShapeHostInfo,
  bounds: Rect,
  retrace: () => void,
): void {
  if (style) {
    if (style.fill === false) return;
    if (style.color === undefined) return;
    g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return;
  }

  if (spec.fill === undefined) return;

  const layers = silhouetteLayersOf(spec.fill);
  for (let i = 0; i < layers.length; i++) {
    if (i > 0) retrace();
    paintSilhouetteLayer(g, layers[i]!, host, bounds);
  }
}

export function applyStroke(
  g: Graphics,
  spec: BaseShapeSpec,
  style: ShapePaintStyle | undefined,
): void {
  if (style?.strokeWidth !== undefined) {
    // Decorations default to `'outside'` alignment so their stroke lives
    // wholly past the silhouette instead of bleeding inward (Pixi's
    // built-in default is center-aligned, which makes a halo's inner band
    // cover the host body — see the `selected` ring + glow regression).
    g.stroke({
      color: style.color ?? 0x000000,
      alpha: style.alpha ?? 1,
      width: style.strokeWidth,
      alignment: alignmentFor(style.alignment ?? 'outside'),
    });
    return;
  }

  const s = spec.stroke;
  if (!s) return;
  const width = s.width ?? 1;
  if (width <= 0) return;
  g.stroke({
    color: s.color,
    alpha: s.alpha ?? 1,
    width,
    alignment: alignmentFor(s.alignment),
    cap: s.cap,
    join: s.join,
  });
}

/**
 * Static-`paintInto` helper for marker shapes. Markers are drawn into a
 * connector's `Graphics` by static methods that have no `host`, so image
 * fills aren't supported here — only `solid` (and the `number` shorthand)
 * apply. The first solid layer in `fill` is used; remaining layers are
 * ignored. Decoration `style` takes precedence.
 */
export function applyMarkerFill(
  g: Graphics,
  fill: ShapeFill | undefined,
  style: ShapePaintStyle | undefined,
): void {
  if (style?.fill !== false && style?.color !== undefined) {
    g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return;
  }
  if (fill === undefined) return;
  if (typeof fill === 'number') {
    g.fill({ color: fill });
    return;
  }
  for (const layer of toLayerArray(fill)) {
    if (layer.kind === 'solid') {
      g.fill({ color: layer.color, alpha: layer.alpha ?? 1 });
      return;
    }
  }
}

// ─── Internals ─────────────────────────────────────────────────────────────

function silhouetteLayersOf(fill: ShapeFill): ReadonlyArray<SilhouetteLayer | { kind: 'shorthand'; color: number }> {
  if (typeof fill === 'number') return [{ kind: 'shorthand', color: fill }];
  return toLayerArray(fill).filter(isSilhouetteLayer);
}

function toLayerArray(fill: Exclude<ShapeFill, number>): ReadonlyArray<ShapeFillLayer> {
  return Array.isArray(fill) ? fill : [fill as ShapeFillLayer];
}

function isSilhouetteLayer(layer: ShapeFillLayer): layer is SilhouetteLayer {
  return layer.kind === 'solid' || layer.kind === 'image';
}

function paintSilhouetteLayer(
  g: Graphics,
  layer: SilhouetteLayer | { kind: 'shorthand'; color: number },
  host: ShapeHostInfo,
  bounds: Rect,
): void {
  if (layer.kind === 'shorthand') {
    g.fill({ color: layer.color });
    return;
  }
  if (layer.kind === 'solid') {
    g.fill({ color: layer.color, alpha: layer.alpha ?? 1 });
    return;
  }
  const tex = host.textureRegistry.get(layer.url);
  if (!tex) {
    void host.textureRegistry
      .load(layer.url)
      .then(() => host.requestRedraw())
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(`[applyFill] image load failed for ${layer.url}:`, err);
      });
    return;
  }
  const matrix = coverFitMatrix(tex, bounds);
  // `textureSpace: 'global'` — interpret our `matrix` as texture→world
  // (forward mapping) without Pixi's default local-bounds auto-fit. Without
  // this, Pixi pre-normalises UV to the shape's bounds and our custom
  // scaling stacks on top of the already-fitted UV, which then tiles via
  // Pixi's auto-enabled `addressMode: 'repeat'` once UV crosses [0, 1].
  g.fill({ texture: tex, alpha: layer.alpha ?? 1, matrix, textureSpace: 'global' });
}

/**
 * Forward texture→world matrix that cover-fits `tex` to `bounds` — uniform
 * scale `max(bounds.w / tex.w, bounds.h / tex.h)`, then centre on the
 * cross-axis. With `textureSpace: 'global'` on the `fill` call, Pixi
 * inverts this and uses it directly for the UV-from-position transform.
 * Cover is the only fit mode the engine offers for image fills — the
 * texture fully covers the silhouette (may crop on the cross-axis, never
 * letterboxes).
 */
function coverFitMatrix(tex: Texture, bounds: Rect): Matrix {
  const tw = tex.width || 1;
  const th = tex.height || 1;
  const s = Math.max(bounds.width / tw, bounds.height / th);
  const mappedW = tw * s;
  const mappedH = th * s;
  const tx = bounds.x + (bounds.width - mappedW) / 2;
  const ty = bounds.y + (bounds.height - mappedH) / 2;
  return new Matrix().set(s, 0, 0, s, tx, ty);
}

function alignmentFor(a: ShapeStroke['alignment']): number {
  return a === 'inside' ? 1 : a === 'outside' ? 0 : 0.5;
}
