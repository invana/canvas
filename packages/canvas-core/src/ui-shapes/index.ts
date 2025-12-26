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
 * import { NodeShape, EdgeShape } from './ui-shapes';
 * 
 * // Create a node
 * const node = new NodeShape({
 *   data: { id: 'n1', x: 100, y: 100, shape: 'circle', label: 'Node 1' },
 *   style: { fill: '#4a90d9', stroke: '#2d5a87', strokeWidth: 2 },
 *   registry,
 * });
 * 
 * // Create an edge
 * const edge = new EdgeShape({
 *   data: { id: 'e1', source: node1, target: node2, pathType: 'bezier' },
 *   style: { stroke: '#666', strokeWidth: 2 },
 *   registry,
 * });
 * ```
 */

// Base
export { BaseShape } from './BaseShape';
export type { BaseShapeData, BaseShapeStyle, BaseShapeOptions } from './BaseShape';

// Node
export { NodeShape } from './NodeShape';
export type { NodeData, NodeStyle, NodeShapeOptions, NodeShapeType, RippleAnimationOptions } from './NodeShape';

// Edge
export { EdgeShape } from './EdgeShape';
export type { EdgeData, EdgeStyle, EdgeShapeOptions, EdgePathType } from './EdgeShape';
