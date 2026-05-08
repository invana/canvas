/**
 * `ring` — primitive shape decoration: outline drawn on top of the host.
 *
 * Static. Geometry strategy:
 * - circle / ellipse host: trace an ellipse contracted by `inset`
 * - non-circle host with `outlinePolyline`: parallel-offset the polygon by
 *   `-inset` px (true shape-following ring for stars, triangles, paths)
 * - non-circle host without polyline: rect (or rounded rect) fallback
 *
 * Multiple rings: set `ringCount > 1` for evenly-spaced concentric outlines
 * (target / radio-wave-frozen effect). Each subsequent ring offsets outward
 * by `ringSpacing` px.
 */

import type { Graphics } from 'pixi.js';
import type { Point, Rect, StaticDecorationKind } from '../../types';
import { offsetPolygon, polyToShape } from '../_polylineUtils';

/**
 * Shared option base for outline-style decorations (`ring`, `halo`, ...).
 * Each decoration adds its own positional fields (`inset`, `padding`, ...)
 * and stroke/fill specifics on top.
 */
export interface OutlineDecorationOpts {
  readonly color: number;
  /** 0..1 opacity. Default depends on the decoration. */
  readonly alpha?: number;
  /** Rounded corner radius for rect-like hosts. Default `0` (sharp). */
  readonly cornerRadius?: number;
}

export interface RingOpts extends OutlineDecorationOpts {
  /** Stroke width. Default `1`. */
  readonly width?: number;
  /**
   * Inset/outset relative to host bounds. Negative = outside; positive = inside.
   * Default `0` (sits on the host edge).
   */
  readonly inset?: number;
  /** Number of concentric rings, evenly spaced. Default `1`. */
  readonly ringCount?: number;
  /**
   * Distance (px) between consecutive rings. Positive grows outward (away
   * from the host). Default `6`. Ignored when `ringCount` is `1`.
   */
  readonly ringSpacing?: number;
}

export function drawRing(
  g: Graphics,
  bounds: Rect,
  opts: RingOpts,
  hostKind?: string,
  outlinePolyline?: ReadonlyArray<Point>,
): void {
  const width = opts.width ?? 1;
  if (width <= 0) return;
  const alpha = opts.alpha ?? 1;
  const inset = opts.inset ?? 0;
  const cornerRadius = opts.cornerRadius ?? 0;
  const ringCount = Math.max(1, Math.round(opts.ringCount ?? 1));
  const ringSpacing = opts.ringSpacing ?? 6;

  const { x, y, width: w, height: h } = bounds;
  const cx = x + w / 2;
  const cy = y + h / 2;

  for (let r = 0; r < ringCount; r++) {
    const insetR = inset - r * ringSpacing;

    if (hostKind === 'circle' || hostKind === 'ellipse') {
      const rx = Math.max(0, w / 2 - insetR);
      const ry = Math.max(0, h / 2 - insetR);
      g.ellipse(cx, cy, rx, ry);
    } else if (outlinePolyline && outlinePolyline.length >= 3) {
      polyToShape(g, offsetPolygon(outlinePolyline, -insetR));
    } else if (cornerRadius > 0) {
      g.roundRect(x + insetR, y + insetR, w - 2 * insetR, h - 2 * insetR, cornerRadius);
    } else {
      g.rect(x + insetR, y + insetR, w - 2 * insetR, h - 2 * insetR);
    }
    g.stroke({ color: opts.color, width, alpha });
  }
}

export const ringKind: StaticDecorationKind<RingOpts> = { draw: drawRing };
