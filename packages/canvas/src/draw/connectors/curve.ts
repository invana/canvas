/**
 * `curve` — primitive connector: smoothed polyline using Catmull-Rom-style
 * quadratic curves through interior vertices.
 *
 * Single responsibility: emits a smoothed polyline into the supplied Graphics.
 * Like `line`, knows nothing about markers or labels — those are layer-side.
 *
 * Smoothing rule:
 *   • <2 points → no draw
 *   • 2 points  → straight line
 *   • ≥3 points → quadratic curve through each interior vertex (vertex is the
 *                 control point; segment ends are at the midpoints of adjacent
 *                 edges). Endpoints are honoured exactly.
 *
 * Pair with `bezier` router for already-smooth curves (the smoothing here is
 * essentially a no-op visually); pair with `orthogonal` to round elbows.
 */

import type { Graphics } from 'pixi.js';
import type { BaseConnectorSpec, ConnectorKind, Point, Rect } from '../types';

export interface CurveConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'curve';
  readonly stroke: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
  readonly cap?: 'butt' | 'round' | 'square';
}

export function drawCurveConnector(
  g: Graphics,
  polyline: ReadonlyArray<Point>,
  spec: CurveConnectorSpec,
): void {
  if (polyline.length < 2) return;
  const width = spec.strokeWidth ?? 1;
  if (width <= 0) return;

  if (polyline.length === 2) {
    g.moveTo(polyline[0]!.x, polyline[0]!.y);
    g.lineTo(polyline[1]!.x, polyline[1]!.y);
  } else {
    g.moveTo(polyline[0]!.x, polyline[0]!.y);
    for (let i = 1; i < polyline.length - 1; i++) {
      const p = polyline[i]!;
      const next = polyline[i + 1]!;
      const mx = (p.x + next.x) / 2;
      const my = (p.y + next.y) / 2;
      g.quadraticCurveTo(p.x, p.y, mx, my);
    }
    const last = polyline[polyline.length - 1]!;
    g.lineTo(last.x, last.y);
  }

  g.stroke({
    color: spec.stroke,
    width,
    alpha: spec.strokeAlpha ?? 1,
    cap: spec.cap,
  });
}

export function curveConnectorBounds(
  polyline: ReadonlyArray<Point>,
  spec: CurveConnectorSpec,
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

export const curveConnectorKind: ConnectorKind<CurveConnectorSpec> = {
  draw: drawCurveConnector,
  bounds: curveConnectorBounds,
};
