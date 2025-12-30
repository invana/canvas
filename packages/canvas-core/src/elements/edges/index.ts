/**
 * Edge Shapes
 * 
 * Exports all edge shape implementations for different path types.
 * 
 * Architecture:
 * - RendererEdgeBase: Abstract base class with common edge functionality
 * - LineEdge: Straight line implementation
 * - BezierEdge: Quadratic bezier curve implementation
 * - OrthogonalEdge: Right-angle path implementation (use cornerRadius in style for rounded corners)
 * 
 * Note: Edge creation is now handled by the Renderer.
 * Use renderer.addEdge() instead of createEdge().
 */

// Base class
export { 
  RendererEdgeBase,
  type EdgePathType,
  type EdgeTangents,
  type RendererEdge,
  type EdgeStyle,
  type EdgeShapeOptions,
} from './RendererEdgeBase';

// Concrete implementations
export { LineEdge, type LineEdgeOptions } from './LineEdge';
export { BezierEdge, type BezierEdgeOptions } from './BezierEdge';
export { OrthogonalEdge, type OrthogonalEdgeOptions } from './OrthogonalEdge';
