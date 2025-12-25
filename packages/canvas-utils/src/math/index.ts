export { vec2 } from './vector.js';
export { math } from './utils.js';
export { geometry } from './geometry.js';
export type { Vector2 } from './vector.js';
export type { EdgeEndpoints } from './geometry.js';

// Re-export individual geometry functions for convenience
export {
  lineCircleIntersection,
  lineEllipseIntersection,
  lineRectIntersection,
  lineRoundedRectIntersection,
  linePolygonIntersection,
  lineSegmentIntersection,
  getRegularPolygonVertices,
  getDiamondVertices,
  getStarVertices,
  distance,
  angle,
  movePoint,
  moveTowards,
  moveAway,
  lerp,
  midpoint,
  normalizeAngle,
  rotatePoint,
  quadraticBezierPoint,
  cubicBezierPoint,
  quadraticBezierTangent,
  cubicBezierTangent,
  calculateEdgeEndpoints,
} from './geometry.js';
