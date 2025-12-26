/**
 * Shape Primitives - Index
 * 
 * Pure drawing functions for basic shapes.
 * These are the building blocks for all node shapes and complex UI components.
 * 
 * Usage:
 * ```typescript
 * import { drawCircle, drawRect, drawPolygon } from '@aspect-ui/canvas-core/primitives';
 * 
 * // Draw a circle
 * drawCircle(graphics, { x: 0, y: 0, radius: 20 }, { fill: '#4CAF50', stroke: '#2E7D32' });
 * 
 * // Compose complex shapes
 * drawRect(graphics, { x: 0, y: 0, width: 100, height: 60 }, { fill: '#fff' });
 * drawCircle(graphics, { x: -30, y: 0, radius: 15 }, { fill: '#ccc' }); // Avatar
 * ```
 */

// Types
export * from './types.js';

// Circle
export {
  drawCircle,
  drawCircleOutline,
  getCircleOutline,
  type CircleParams,
} from './circle.js';

// Rectangle
export {
  drawRect,
  drawRectOutline,
  getRectOutline,
  getRectIntersection,
  hitTestRect,
  type RectParams,
} from './rect.js';

// Rounded Rectangle
export {
  drawRoundedRect,
  drawRoundedRectOutline,
  getRoundedRectOutline,
  type RoundedRectParams,
} from './roundedRect.js';

// Polygon
export {
  drawPolygon,
  drawPolygonOutline,
  drawPolygonFromPoints,
  drawPolygonOutlineFromPoints,
  getPolygonPoints,
  getPolygonOutline,
  getPolygonIntersection,
  hitTestPolygon,
  // Convenience shapes
  drawTriangle,
  drawDiamond,
  drawPentagon,
  drawHexagon,
  drawOctagon,
  drawTriangleOutline,
  drawDiamondOutline,
  drawHexagonOutline,
  type PolygonParams,
} from './polygon.js';

// Ellipse
export {
  drawEllipse,
  drawEllipseOutline,
  getEllipseOutline,
  type EllipseParams,
} from './ellipse.js';
