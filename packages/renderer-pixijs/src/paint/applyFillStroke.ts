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
 * painting each into the silhouette via `g.fill()`. Image layers honour
 * two CSS-aligned knobs: `fit` (`'cover'` default, or `'contain'`) and
 * `padding` (pixel inset on the silhouette for *this layer only*, so the
 * gap between the full silhouette and the inset silhouette paints from
 * the layer underneath — typically a `solid` plate). The `retrace`
 * callback supplied by the shape accepts the requested inset and
 * re-traces its silhouette accordingly; every built-in shape's
 * `drawGeometry` already honours `style.inset`, so per-layer padding
 * works uniformly across `circle` / `rect` / `polygon` / `regular-polygon`
 * / `star` / `arc`. Multiple silhouette layers are supported — each is
 * re-traced before painting (Pixi's `fill` consumes the most recent
 * path). **Inset-content** layers (`glyph`, `svg`, `svg-url`) are handled
 * separately by `ShapeBase.syncInsetLayers` / `insetContentLayer.ts` —
 * they're skipped here.
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
  retrace: (inset?: number) => void,
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
    const layer = layers[i]!;
    const inset = layerInset(layer);
    // Retrace when we're past the first layer (its silhouette was already
    // consumed) or when this layer wants a non-zero inset (the pre-applyFill
    // trace is at inset 0). Otherwise the first layer can reuse the trace
    // the shape made before calling applyFill.
    if (i > 0 || inset > 0) retrace(inset);
    paintSilhouetteLayer(g, layer, host, insetBounds(bounds, inset));
  }
}

/**
 * Apply the spec's (or decoration override's) stroke to `g`.
 *
 * `retrace` re-traces the silhouette and is invoked **only when a stroke will
 * actually be emitted** — the preceding `applyFill` consumed the fill trace, so
 * the stroke needs a fresh path. Crucially, when there's *nothing to stroke*
 * this leaves **no** dangling path behind: a shape used as a {@link
 * CompositeShape} root draws more geometry into the same `Graphics` afterwards,
 * and Pixi v8's `g.fill()` fills every un-consumed subpath since the last fill —
 * so a dangling silhouette trace would get flooded with the next part's colour
 * (the whole card painting in the accent-bar's blue). Tracing lazily here is
 * what keeps a stroke-less card body its real fill colour.
 */
export function applyStroke(
  g: Graphics,
  spec: BaseShapeSpec,
  style: ShapePaintStyle | undefined,
  retrace?: () => void,
): void {
  if (style?.strokeWidth !== undefined) {
    // Decorations default to `'outside'` alignment so their stroke lives
    // wholly past the silhouette instead of bleeding inward (Pixi's
    // built-in default is center-aligned, which makes a halo's inner band
    // cover the host body — see the `selected` ring + glow regression).
    retrace?.();
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
  retrace?.();
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
  // Force clamp-to-edge on the texture's sampler so UV outside [0, 1]
  // reads the boundary pixel instead of tiling. Pixi v8 reads the wrap
  // mode from `source.style.addressModeU` / `addressModeV`; assignment
  // alone is not enough — `TextureStyle` caches the GPU sampler resource
  // ID on `_sharedResourceId`, and reuses the previously-built sampler
  // (default `'repeat'`) until `style.update()` invalidates the cache
  // and re-emits `'change'`. Without the explicit `update()` you see
  // tiled copies of the texture across the silhouette for `fit:
  // 'contain'` (and any other case where the matrix maps UV outside
  // [0, 1]). For PNG sources with transparent edges, clamp-to-edge
  // yields a transparent margin (the underlying `bgFill` reads
  // through); for opaque sources it smears the edge pixel as a
  // 1px-stretched border.
  const style = tex.source.style;
  if (style.addressModeU !== 'clamp-to-edge' || style.addressModeV !== 'clamp-to-edge') {
    style.addressMode = 'clamp-to-edge';
    style.update();
  }
  const matrix = textureFitMatrix(layer.fit ?? 'cover', tex, bounds);
  // `textureSpace: 'global'` — interpret our `matrix` as texture→world
  // (forward mapping) without Pixi's default local-bounds auto-fit. Without
  // this, Pixi pre-normalises UV to the shape's bounds and our custom
  // scaling stacks on top of the already-fitted UV.
  g.fill({ texture: tex, alpha: layer.alpha ?? 1, matrix, textureSpace: 'global' });
}

/**
 * Forward texture→world matrix sizing `tex` into `bounds` per the chosen
 * fit mode. Uniform scale either way; the only difference is `max(...)` vs
 * `min(...)` for the cover-vs-contain decision. The result is centred on
 * the cross-axis. With `textureSpace: 'global'` on the `fill` call, Pixi
 * inverts this and uses it directly for the UV-from-position transform.
 *
 *   - `'cover'`   — texture fully covers `bounds`; may crop on the
 *                   cross-axis but never leaves transparent edges.
 *   - `'contain'` — texture fully fits inside `bounds`; may letterbox.
 *                   The letterbox area still samples the texture, but
 *                   sits outside [0,1] UV → tiles via Pixi's repeat
 *                   addressMode. For a clean transparent letterbox,
 *                   pair the image layer with `padding > 0` so the
 *                   silhouette is shrunk to match the texture's
 *                   aspect-fit rect.
 */
function textureFitMatrix(
  fit: 'cover' | 'contain',
  tex: Texture,
  bounds: Rect,
): Matrix {
  const tw = tex.width || 1;
  const th = tex.height || 1;
  const sx = bounds.width / tw;
  const sy = bounds.height / th;
  const s = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  const mappedW = tw * s;
  const mappedH = th * s;
  const tx = bounds.x + (bounds.width - mappedW) / 2;
  const ty = bounds.y + (bounds.height - mappedH) / 2;
  return new Matrix().set(s, 0, 0, s, tx, ty);
}

function layerInset(
  layer: SilhouetteLayer | { kind: 'shorthand'; color: number },
): number {
  return layer.kind === 'image' ? layer.padding ?? 0 : 0;
}

function insetBounds(bounds: Rect, inset: number): Rect {
  if (inset <= 0) return bounds;
  return {
    x: bounds.x + inset,
    y: bounds.y + inset,
    width: Math.max(0, bounds.width - inset * 2),
    height: Math.max(0, bounds.height - inset * 2),
  };
}

function alignmentFor(a: ShapeStroke['alignment']): number {
  return a === 'inside' ? 1 : a === 'outside' ? 0 : 0.5;
}
