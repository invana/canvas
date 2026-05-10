/**
 * Fill + stroke resolution for `ShapeBase` subclasses.
 *
 * `drawGeometry` traces the silhouette into a `Graphics` once (the initial
 * trace), then calls `applyFill(g, spec, style, host, retrace)` followed by
 * a re-trace and `applyStroke(g, spec, style)`. When `style` is supplied
 * (decoration override) it takes precedence over `spec.fill` / `spec.stroke`.
 *
 * Layered fills: `spec.fill` may be a single layer or an array. This module
 * iterates only **silhouette-filler** layer kinds (`solid`, `image`), painting
 * each into the silhouette via `g.fill()`. Multiple silhouette layers are
 * supported — each is re-traced before painting (Pixi's `fill` consumes the
 * most recent path). **Inset-content** layer kinds (`glyph`, `svg`,
 * `image-inset`) are handled separately by `ShapeBase.syncInsetLayers` /
 * `insetContentLayer.ts` — they're skipped here.
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
    g.stroke({
      color: style.color ?? 0x000000,
      alpha: style.alpha ?? 1,
      width: style.strokeWidth,
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
  // layer.kind === 'image'
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
  const matrix = textureFitMatrix(layer.fit ?? 'fill', tex, bounds);
  g.fill({ texture: tex, alpha: layer.alpha ?? 1, matrix });
}

/**
 * Compute the texture-coord transform matrix for a given `fit` mode. Pixi's
 * `fill({ texture, matrix })` interprets `matrix` as the transform from the
 * texture's pixel space into the Graphics' local space — i.e. point `(u,v)`
 * in the texture appears at `matrix * (u,v)` on the canvas. We therefore
 * build the *forward* mapping (no manual inversion required).
 *
 *   - `tile`    — identity; Pixi's default 1:1 tiling.
 *   - `fill`    — non-uniform stretch to bounds (aspect not preserved).
 *   - `cover`   — uniform scale = max(...); image fully covers, may crop.
 *   - `contain` — uniform scale = min(...); image fits inside, may letterbox.
 *   - `none`    — natural pixel size, centred at the bounds centre.
 */
function textureFitMatrix(
  fit: 'fill' | 'cover' | 'contain' | 'none' | 'tile',
  tex: Texture,
  bounds: Rect,
): Matrix {
  const tw = tex.width || 1;
  const th = tex.height || 1;
  const m = new Matrix();
  if (fit === 'tile') return m;

  let sx: number;
  let sy: number;
  if (fit === 'fill') {
    sx = bounds.width / tw;
    sy = bounds.height / th;
  } else if (fit === 'cover') {
    const s = Math.max(bounds.width / tw, bounds.height / th);
    sx = sy = s;
  } else if (fit === 'contain') {
    const s = Math.min(bounds.width / tw, bounds.height / th);
    sx = sy = s;
  } else {
    // none
    sx = sy = 1;
  }

  const mappedW = tw * sx;
  const mappedH = th * sy;
  const tx = bounds.x + (bounds.width - mappedW) / 2;
  const ty = bounds.y + (bounds.height - mappedH) / 2;
  m.set(sx, 0, 0, sy, tx, ty);
  return m;
}

function alignmentFor(a: ShapeStroke['alignment']): number {
  return a === 'inside' ? 1 : a === 'outside' ? 0 : 0.5;
}
