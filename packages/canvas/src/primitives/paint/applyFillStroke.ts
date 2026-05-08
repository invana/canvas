/**
 * Fill + stroke resolution for `ShapeBase` subclasses.
 *
 * `drawGeometry` traces the silhouette into a `Graphics`, then calls
 * `applyFill(g, spec, style, host)` and `applyStroke(g, spec, style)`. When
 * `style` is supplied (decoration override), it takes precedence over the
 * spec's `fill` / `stroke` — used by glow, halo, marching-ants, etc.
 *
 * Icon fills don't fill via Pixi's `g.fill()` — they are layered on top of
 * the silhouette via a sibling `Container` (see `iconLayer.ts` and
 * `ShapeBase.syncIconLayer`). This module only paints the optional `background`
 * plate underneath an icon.
 */

import type { Graphics } from 'pixi.js';
import type {
  BaseShapeSpec,
  ShapeHostInfo,
  ShapePaintStyle,
  ShapeStroke,
} from '../types';

export function applyFill(
  g: Graphics,
  spec: BaseShapeSpec,
  style: ShapePaintStyle | undefined,
  host: ShapeHostInfo,
): void {
  if (style) {
    if (style.fill === false) return;
    if (style.color === undefined) return;
    g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return;
  }

  const fill = spec.fill;
  if (fill === undefined) return;

  if (typeof fill === 'number') {
    g.fill({ color: fill });
    return;
  }

  switch (fill.kind) {
    case 'solid':
      g.fill({ color: fill.color, alpha: fill.alpha ?? 1 });
      return;

    case 'image': {
      const tex = host.textureRegistry.get(fill.url);
      if (!tex) {
        // Lazy-load on miss; the texture will be cached for the next redraw.
        // The host shape redraws itself when its spec changes; for first-paint
        // misses, the layer should preload via `textureRegistry.preload(...)`
        // before adding shapes that reference the URL.
        host.textureRegistry.load(fill.url).catch(() => {});
        return;
      }
      g.fill({
        texture: tex,
        alpha: fill.alpha ?? 1,
      });
      return;
    }

    case 'icon': {
      // The glyph is layered separately by `ShapeBase.syncIconLayer`. Here we
      // only paint the optional plate underneath.
      const bg = fill.background;
      if (bg) g.fill({ color: bg.color, alpha: bg.alpha ?? 1 });
      return;
    }
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

function alignmentFor(a: ShapeStroke['alignment']): number {
  return a === 'inside' ? 1 : a === 'outside' ? 0 : 0.5;
}
