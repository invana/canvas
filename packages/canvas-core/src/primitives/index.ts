/**
 * Primitives Module
 * 
 * Pure drawing functions for all visual elements.
 * This is the ONLY place where PixiJS Graphics API should be used.
 * 
 * ## Architecture
 * 
 * All primitives follow this pattern:
 * ```typescript
 * function drawShape(graphics: Graphics, params: TParams, style: TStyle): void
 * ```
 * 
 * - **graphics**: PixiJS Graphics instance to draw on
 * - **params**: Shape-specific parameters (position, size, etc.)
 * - **style**: Visual styling (fill, stroke, etc.)
 * 
 * ## Modules
 * 
 * - **shapes**: Basic shapes (circle, rect, polygon, etc.)
 * - **fills**: Fill system (solid, gradients, images, patterns)
 * - **paths**: Edge paths (line, bezier, orthogonal)
 * - **arrows**: Arrow heads (triangle, circle, diamond, etc.)
 * - **effects**: Visual effects (ripple, glow, etc.)
 * 
 * @example
 * ```typescript
 * import { 
 *   drawCircle, 
 *   drawLine, 
 *   drawArrow, 
 *   drawRippleEffect 
 * } from './primitives';
 * 
 * // Draw a node
 * drawCircle(graphics, { x: 0, y: 0, radius: 30 }, { fill: '#4a90d9', stroke: '#2d5a87', strokeWidth: 2 });
 * 
 * // Draw an edge
 * drawLine(graphics, { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } }, { stroke: '#666', strokeWidth: 2 });
 * 
 * // Draw arrow head
 * drawArrow(graphics, 'triangle', { x: 100, y: 100, angle: Math.PI / 4, size: 10 }, { fill: '#666' });
 * ```
 */

// ============================================================================
// FILLS
// ============================================================================

export type {
  Fill,
  SolidFill,
  LinearGradientFill,
  RadialGradientFill,
  ImageFill,
  PatternFill,
  FillBounds,
} from './fills';

export {
  isSolidFill,
  isLinearGradientFill,
  isRadialGradientFill,
  isImageFill,
  isPatternFill,
  normalizeFill,
  applyFill,
  applyFillSync,
} from './fills';

// ============================================================================
// SHAPES
// ============================================================================

export type { ShapeStyle, ShapeDrawFn } from './shapes';

// Circle
export type { CircleParams } from './shapes';
export { drawCircle, drawCircleOutline } from './shapes';

// Rectangle
export type { RectParams } from './shapes';
export { drawRect, drawRectOutline } from './shapes';

// Rounded Rectangle
export type { RoundedRectParams } from './shapes';
export { drawRoundedRect, drawRoundedRectOutline } from './shapes';

// Ellipse
export type { EllipseParams } from './shapes';
export { drawEllipse, drawEllipseOutline } from './shapes';

// Polygon
export type { PolygonParams } from './shapes';
export {
  getPolygonPoints,
  drawPolygon,
  drawPolygonOutline,
  drawTriangle,
  drawDiamond,
  drawPentagon,
  drawHexagon,
  drawOctagon,
} from './shapes';

// ============================================================================
// PATHS
// ============================================================================

export type { Point, PathStyle, Direction, PathDrawFn } from './paths';
export { getAngle, getDistance, getMidpoint, getPointOnLine } from './paths';

// Line
export type { LineParams, PolylineParams } from './paths';
export {
  drawLine,
  drawPolyline,
  getLineTangentAtEnd,
  getLineTangentAtStart,
  getLineEndOffset,
  getLineStartOffset,
} from './paths';

// Bezier
export type { QuadraticBezierParams, CubicBezierParams, AutoBezierParams } from './paths';
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
} from './paths';

// Orthogonal
export type { OrthogonalParams } from './paths';
export {
  drawOrthogonalPath,
  drawRoundedOrthogonalPath,
  calculateOrthogonalPath,
  getOrthogonalTangentAtEnd,
  getOrthogonalTangentAtStart,
} from './paths';

// ============================================================================
// ARROWS
// ============================================================================

export type { ArrowStyle, ArrowParams, ArrowDrawFn, ArrowType } from './arrows';
export { getArrowOffset, drawArrow } from './arrows';

// Individual arrow types
export {
  drawTriangleArrow,
  drawTriangleOutlineArrow,
  drawThinTriangleArrow,
  drawVeeArrow,
  drawCircleArrow,
  drawCircleOutlineArrow,
  drawDiamondArrow,
  drawDiamondOutlineArrow,
  drawSquareArrow,
  drawSquareOutlineArrow,
  drawTeeArrow,
  drawBarArrow,
} from './arrows';

// ============================================================================
// EFFECTS
// ============================================================================

export type { EffectStyle, EffectParams, EffectDrawFn } from './effects';

// Ripple
export type { RippleParams } from './effects';
export {
  drawRippleRing,
  drawRippleEffect,
  calculateRippleRadius,
  calculateRippleAlpha,
} from './effects';

// Glow
export type { CircleGlowParams, RectGlowParams } from './effects';
export {
  drawCircleGlow,
  drawRectGlow,
  drawSelectionHighlight,
} from './effects';

// ============================================================================
// LABELS
// ============================================================================

export type {
  LabelPosition,
  LabelAlign,
  LabelBaseline,
  LabelStyle,
  LabelParams,
  ShapeBounds,
} from './labels';

export {
  toPixiTextStyle,
  calculateLabelPosition,
  truncateText,
  createLabel,
  createPositionedLabel,
  updateLabel,
  repositionLabel,
  calculateEdgeLabelPosition,
} from './labels';
