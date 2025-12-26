/**
 * Path Primitives Module
 * 
 * Pure functions for drawing paths/edges.
 * All PixiJS Graphics calls for paths are contained here.
 * 
 * @example
 * ```typescript
 * import { drawLine, drawAutoBezier, drawOrthogonalPath } from './primitives/paths';
 * 
 * // Draw a straight line
 * drawLine(graphics, { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } }, { stroke: '#000', strokeWidth: 2 });
 * 
 * // Draw a curved edge
 * drawAutoBezier(graphics, { from, to, curvature: 0.3 }, { stroke: '#666', strokeWidth: 1 });
 * 
 * // Draw an orthogonal path
 * drawOrthogonalPath(graphics, { from, to, sourceDirection: 'right', targetDirection: 'left' }, style);
 * ```
 */

// Types
export type { Point, PathStyle, Direction, PathDrawFn } from './types';
export { getAngle, getDistance, getMidpoint, getPointOnLine } from './types';

// Line
export type { LineParams, PolylineParams } from './line';
export {
  drawLine,
  drawPolyline,
  getLineTangentAtEnd,
  getLineTangentAtStart,
  getLineEndOffset,
  getLineStartOffset,
} from './line';

// Bezier
export type { QuadraticBezierParams, CubicBezierParams, AutoBezierParams } from './bezier';
export {
  drawQuadraticBezier,
  drawCubicBezier,
  drawAutoBezier,
  calculateQuadraticControl,
  calculateCubicControls,
  getQuadraticBezierPoint,
  getCubicBezierPoint,
  getQuadraticTangentAtEnd,
  getQuadraticTangentAtStart,
  getCubicTangentAtEnd,
  getCubicTangentAtStart,
  getQuadraticEndOffset,
  getQuadraticStartOffset,
} from './bezier';

// Orthogonal
export type { OrthogonalParams } from './orthogonal';
export {
  drawOrthogonalPath,
  drawRoundedOrthogonalPath,
  calculateOrthogonalPath,
  getOrthogonalTangentAtEnd,
  getOrthogonalTangentAtStart,
} from './orthogonal';
