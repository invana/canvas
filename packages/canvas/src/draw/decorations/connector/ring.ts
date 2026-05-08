/**
 * `ring-connector` — primitive connector decoration: a stroked outline that
 * tubes the routed polyline at a perpendicular `inset` offset from the
 * connector's centerline.
 *
 * Static. Geometry: a closed ribbon polygon at half-width `inset + width/2`,
 * stroked at `width`. For a straight connector this draws an elongated
 * pill-less rectangle outline; for a curved/orthogonal polyline the outline
 * follows each bend with proper miter joints (clamped at a 4× miter limit
 * inside `ribbonPolygon`).
 *
 * Visual analog of `shape/ring`: the shape variant draws a parallel-offset
 * outline around the host's perimeter; the connector variant draws a
 * parallel-offset tube around the connector's polyline.
 *
 * Multiple rings: set `ringCount > 1` for evenly-spaced concentric tube
 * outlines. Each subsequent ring offsets outward by `ringSpacing` px.
 */

import type { Graphics } from 'pixi.js';
import type { Point, StaticConnectorDecorationKind } from '../../types';
import { polyToShape, ribbonPolygon } from '../_polylineUtils';

export interface RingConnectorOpts {
  readonly color: number;
  /** Stroke width. Default `1`. */
  readonly width?: number;
  /** 0..1 alpha. Default `1`. */
  readonly alpha?: number;
  /** Perpendicular distance from the connector centerline. Default `4`. */
  readonly inset?: number;
  /** Number of concentric tube outlines, evenly spaced. Default `1`. */
  readonly ringCount?: number;
  /**
   * Distance (px) between consecutive rings. Positive grows outward (away
   * from the centerline). Default `6`. Ignored when `ringCount` is `1`.
   */
  readonly ringSpacing?: number;
}

export function drawRingConnector(
  g: Graphics,
  polyline: ReadonlyArray<Point>,
  opts: RingConnectorOpts,
): void {
  const width = opts.width ?? 1;
  if (width <= 0 || polyline.length < 2) return;
  const alpha = opts.alpha ?? 1;
  const inset = opts.inset ?? 4;
  const ringCount = Math.max(1, Math.round(opts.ringCount ?? 1));
  const ringSpacing = opts.ringSpacing ?? 6;

  for (let r = 0; r < ringCount; r++) {
    const halfWidth = inset + r * ringSpacing + width / 2;
    const ribbon = ribbonPolygon(polyline, halfWidth);
    if (ribbon.length < 3) continue;
    polyToShape(g, ribbon);
    g.stroke({ color: opts.color, width, alpha });
  }
}

export const ringConnectorKind: StaticConnectorDecorationKind<RingConnectorOpts> =
  { draw: drawRingConnector };
