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

import type { Graphics } from 'pixi.js';
import type {
  BaseShapeSpec,
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
    paintSilhouetteLayer(g, layers[i]!, host);
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
    host.textureRegistry.load(layer.url).catch(() => {});
    return;
  }
  g.fill({ texture: tex, alpha: layer.alpha ?? 1 });
}

function alignmentFor(a: ShapeStroke['alignment']): number {
  return a === 'inside' ? 1 : a === 'outside' ? 0 : 0.5;
}
