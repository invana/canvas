/**
 * Edge Shapes
 * 
 * Exports all edge shape implementations for different path types.
 * 
 * Architecture:
 * - EdgeShapeBase: Abstract base class with common edge functionality
 * - LineEdge: Straight line implementation
 * - BezierEdge: Quadratic bezier curve implementation
 * - OrthogonalEdge: Right-angle path implementation
 * - OrthogonalRoundedEdge: Orthogonal with rounded corners
 * 
 * Note: Edge creation is now handled by the Renderer.
 * Use renderer.addEdge() instead of createEdge().
 */

// Base class
export { 
  EdgeShapeBase,
  type EdgePathType,
  type EdgeTangents,
  type EdgeData,
  type EdgeStyle,
  type EdgeShapeOptions,
} from './EdgeShapeBase';

// Concrete implementations
export { LineEdge, type LineEdgeOptions } from './LineEdge';
export { BezierEdge, type BezierEdgeOptions } from './BezierEdge';
export { OrthogonalEdge, OrthogonalRoundedEdge, type OrthogonalEdgeOptions } from './OrthogonalEdge';
