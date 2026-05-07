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
  const halfWidth = inset + width / 2;
  const ribbon = ribbonPolygon(polyline, halfWidth);
  if (ribbon.length < 3) return;
  polyToShape(g, ribbon);
  g.stroke({ color: opts.color, width, alpha });
}

export const ringConnectorKind: StaticConnectorDecorationKind<RingConnectorOpts> =
  { draw: drawRingConnector };
