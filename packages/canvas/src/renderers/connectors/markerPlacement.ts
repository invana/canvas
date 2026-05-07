/**
 * Endpoint anchor + tangent angle helpers used by connectors when painting
 * source/target markers via `ShapeCtor.paintInto`. The source angle is the
 * **reversed** tangent (so an arrow placed at the source faces back along
 * the line toward the source point); the target angle is the forward
 * tangent (so an arrow placed at the target points into the target).
 */

import type { Point } from '../types';

export interface AnchorAngle {
  readonly anchor: Point;
  /** Angle in radians. Pass to `ShapeCtor.paintInto`. */
  readonly angleRad: number;
}

/**
 * Anchor + reversed-tangent angle for the polyline's source endpoint, or
 * `null` if the polyline has fewer than 2 points.
 */
export function sourceAnchorAngle(points: ReadonlyArray<Point>): AnchorAngle | null {
  if (points.length < 2) return null;
  const a = points[0]!;
  const b = points[1]!;
  return { anchor: a, angleRad: Math.atan2(a.y - b.y, a.x - b.x) };
}

/**
 * Anchor + forward-tangent angle for the polyline's target endpoint, or
 * `null` if the polyline has fewer than 2 points.
 */
export function targetAnchorAngle(points: ReadonlyArray<Point>): AnchorAngle | null {
  if (points.length < 2) return null;
  const a = points[points.length - 2]!;
  const b = points[points.length - 1]!;
  return { anchor: b, angleRad: Math.atan2(b.y - a.y, b.x - a.x) };
}
