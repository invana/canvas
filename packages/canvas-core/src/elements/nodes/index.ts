/**
 * Node Shapes
 * 
 * Exports all node shape classes and types.
 * 
 * Note: Node creation is now handled by the Renderer.
 * Use renderer.addNode() instead of createNode().
 */

// Base class
export {
  NodeShapeBase,
  type NodeData,
  type NodeStyle,
  type NodeShapeOptions,
  type NodeShapeType,
  type RippleAnimationOptions,
  type Point,
  type Bounds,
  type NodeBadge,
  type BadgePosition,
} from './NodeShapeBase';

// Concrete implementations
export { CircleNode } from './CircleNode';
export { EllipseNode } from './EllipseNode';
export { RectNode } from './RectNode';
export { RoundedRectNode } from './RoundedRectNode';
export { 
  PolygonNode, 
  TriangleNode, 
  DiamondNode, 
  PentagonNode, 
  HexagonNode, 
  OctagonNode,
  type PolygonNodeOptions,
} from './PolygonNode';
