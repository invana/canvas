/**
 * `line` — primitive connector: stroked polyline.
 *
 * Single responsibility: emits a polyline into the supplied Graphics. Knows
 * nothing about markers, labels, or compound edge composition — those are
 * a Layer concern. The polyline arrives pre-routed (the renderer runs the
 * spec's registered router and caches the result).
 *
 * Bounds are the polyline AABB, inflated by stroke half-width so the spatial
 * index covers the visible stroke band.
 */

import type { Graphics } from 'pixi.js';
import type { BaseConnectorSpec, ConnectorKind, Point, Rect } from '../types';

export interface LineConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'line';
  readonly stroke: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
}

export function drawLineConnector(
  g: Graphics,
  polyline: ReadonlyArray<Point>,
  spec: LineConnectorSpec,
): void {
  if (polyline.length < 2) return;
  const width = spec.strokeWidth ?? 1;
  if (width <= 0) return;

  g.moveTo(polyline[0]!.x, polyline[0]!.y);
  for (let i = 1; i < polyline.length; i++) {
    g.lineTo(polyline[i]!.x, polyline[i]!.y);
  }
  g.stroke({
    color: spec.stroke,
    width,
    alpha: spec.strokeAlpha ?? 1,
    cap: spec.cap,
    join: spec.join,
  });
}

export function lineConnectorBounds(
  polyline: ReadonlyArray<Point>,
  spec: LineConnectorSpec,
): Rect {
  if (polyline.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = polyline[0]!.x, minY = polyline[0]!.y;
  let maxX = minX, maxY = minY;
  for (let i = 1; i < polyline.length; i++) {
    const p = polyline[i]!;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const pad = (spec.strokeWidth ?? 1) / 2;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + 2 * pad,
    height: maxY - minY + 2 * pad,
  };
}

export const lineConnectorKind: ConnectorKind<LineConnectorSpec> = {
  draw: drawLineConnector,
  bounds: lineConnectorBounds,
};
