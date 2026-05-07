/**
 * Marker spec builders — convenience helpers that return registered shape
 * specs ready to drop into a connector's `sourceMarker` / `targetMarker`
 * field. Markers are not a separate primitive: they are shapes that the
 * connector paints into its own Graphics via the shape's static `paintInto`.
 *
 * Custom markers don't need a builder — just hand any registered shape spec
 * (polygon, path, circle, …) to the connector. These helpers exist so the
 * common four shapes don't require constructing polygon arrays inline.
 */

import type { CircleShapeSpec } from '../shapes/CircleShape';
import type { PolygonShapeSpec } from '../shapes/PolygonShape';
import type { RectShapeSpec } from '../shapes/RectShape';

/** Common style fields the marker builders accept. */
export interface MarkerStyle {
  /** Solid fill colour. Default `0x000000`. */
  readonly color?: number;
  /** 0..1. Default `1`. */
  readonly alpha?: number;
}

const DEFAULT_COLOR = 0x000000;

/**
 * Triangle pointing along `+x` (anchored at the tip). Use as a `targetMarker`
 * for a classic arrowhead-on-line — the connector orients it forward into
 * the target endpoint.
 */
export function arrowMarkerSpec(
  size: number,
  style?: MarkerStyle,
): Omit<PolygonShapeSpec, 'x' | 'y'> {
  return {
    kind: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: -size, y: -size / 2 },
      { x: -size, y: size / 2 },
    ],
    fill: style?.color ?? DEFAULT_COLOR,
    fillAlpha: style?.alpha ?? 1,
  };
}

/** Solid circle, anchored at its centre. */
export function circleMarkerSpec(
  size: number,
  style?: MarkerStyle,
): Omit<CircleShapeSpec, 'x' | 'y'> {
  return {
    kind: 'circle',
    r: size / 2,
    fill: style?.color ?? DEFAULT_COLOR,
    fillAlpha: style?.alpha ?? 1,
  };
}

/** Solid square (axis-aligned in marker-local space; rotates with tangent). */
export function squareMarkerSpec(
  size: number,
  style?: MarkerStyle,
): Omit<RectShapeSpec, 'x' | 'y'> {
  return {
    kind: 'rect',
    width: size,
    height: size,
    fill: style?.color ?? DEFAULT_COLOR,
    fillAlpha: style?.alpha ?? 1,
  };
}

/** Solid diamond (square rotated 45°, drawn as a polygon). */
export function diamondMarkerSpec(
  size: number,
  style?: MarkerStyle,
): Omit<PolygonShapeSpec, 'x' | 'y'> {
  const r = size / 2;
  return {
    kind: 'polygon',
    points: [
      { x: r, y: 0 },
      { x: 0, y: r },
      { x: -r, y: 0 },
      { x: 0, y: -r },
    ],
    fill: style?.color ?? DEFAULT_COLOR,
    fillAlpha: style?.alpha ?? 1,
  };
}
