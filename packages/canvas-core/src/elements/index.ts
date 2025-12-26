/**
 * UI Shapes Module
 * 
 * High-level shape components that use primitives for rendering.
 * These are the main building blocks for canvas visualizations.
 * 
 * ## Architecture
 * 
 * ```
 * UI Shapes (this module)
 *   ↓ uses
 * Primitives (pure drawing functions)
 *   ↓ wraps
 * PixiJS Graphics API
 * ```
 * 
 * All UI Shapes:
 * - Extend `BaseShape` for common functionality
 * - Use the `Registry` to access drawing primitives
 * - Never call PixiJS Graphics API directly
 * 
 * @example
 * ```typescript
 * import { CircleNode, LineEdge } from './ui-shapes';
 * 
 * // Create a node
 * const node = new CircleNode({
 *   data: { id: 'n1', x: 100, y: 100, radius: 30, label: 'Node 1' },
 *   style: { fill: '#4a90d9', stroke: '#2d5a87', strokeWidth: 2 },
 *   registry,
 * });
 * 
 * // Create an edge
 * const edge = new LineEdge({
 *   data: { id: 'e1', source: { x: 0, y: 0 }, target: { x: 100, y: 100 } },
 *   style: { stroke: '#666', strokeWidth: 2 },
 *   registry,
 * });
 * ```
 */

// Base
export { BaseShape } from './BaseShape';
export type { BaseShapeData, BaseShapeStyle, BaseShapeOptions } from './BaseShape';

// Node shapes
export {
  NodeShapeBase,
  CircleNode,
  EllipseNode,
  RectNode,
  RoundedRectNode,
  PolygonNode,
  TriangleNode,
  DiamondNode,
  PentagonNode,
  HexagonNode,
  OctagonNode,
} from './nodes';
export type { 
  NodeData, 
  NodeStyle, 
  NodeShapeOptions, 
  NodeShapeType, 
  RippleAnimationOptions,
  Point,
  Bounds,
  PolygonNodeOptions,
} from './nodes';

// Edge shapes
export {
  EdgeShapeBase,
  LineEdge,
  BezierEdge,
  OrthogonalEdge,
  OrthogonalRoundedEdge,
} from './edges';
export type {
  EdgeData,
  EdgeStyle,
  EdgeShapeOptions,
  EdgePathType,
  EdgeTangents,
  LineEdgeOptions,
  BezierEdgeOptions,
  OrthogonalEdgeOptions,
} from './edges';
