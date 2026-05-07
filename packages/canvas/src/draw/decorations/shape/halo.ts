/**
 * `halo` — primitive shape decoration: filled ring outside host bounds.
 *
 * Static (no animation). Single responsibility: emit halo geometry into the
 * supplied Graphics given host bounds + (optionally) the host's outline
 * polyline.
 *
 * Geometry strategy:
 * - circle / ellipse host: trace an ellipse expanded by `padding`
 * - non-circle host with `outlinePolyline`: parallel-offset the polygon by
 *   `padding` px (true shape-following halo for stars, triangles, paths)
 * - non-circle host without polyline: AABB rect (or rounded rect) fallback
 */

import type { Graphics } from 'pixi.js';
import type { Point, Rect, StaticDecorationKind } from '../../types';
import { offsetPolygon, polyToShape } from '../_polylineUtils';
import type { OutlineDecorationOpts } from './border';

export interface HaloOpts extends OutlineDecorationOpts {
  /** Padding outside the host bounds. Default `4`. */
  readonly padding?: number;
}

export function drawHalo(
  g: Graphics,
  bounds: Rect,
  opts: HaloOpts,
  hostKind?: string,
  outlinePolyline?: ReadonlyArray<Point>,
): void {
  const padding = opts.padding ?? 4;
  const alpha = opts.alpha ?? 0.4;
  const cornerRadius = opts.cornerRadius ?? 0;
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (hostKind === 'circle' || hostKind === 'ellipse') {
    g.ellipse(cx, cy, width / 2 + padding, height / 2 + padding);
  } else if (outlinePolyline && outlinePolyline.length >= 3) {
    polyToShape(g, offsetPolygon(outlinePolyline, padding));
  } else if (cornerRadius > 0) {
    g.roundRect(
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2,
      cornerRadius + padding,
    );
  } else {
    g.rect(x - padding, y - padding, width + padding * 2, height + padding * 2);
  }
  g.fill({ color: opts.color, alpha });
}

export const haloKind: StaticDecorationKind<HaloOpts> = { draw: drawHalo };
