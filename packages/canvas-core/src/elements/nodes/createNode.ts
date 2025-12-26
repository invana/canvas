/**
 * Node Factory
 * 
 * Factory function to create the appropriate node shape based on type.
 */

import type { Registry } from '../../rendering/Registry';
import type { NodeData, NodeStyle } from './NodeShapeBase';
import { NodeShapeBase } from './NodeShapeBase';
import { CircleNode } from './CircleNode';
import { EllipseNode } from './EllipseNode';
import { RectNode } from './RectNode';
import { RoundedRectNode } from './RoundedRectNode';
import { PolygonNode, TriangleNode, DiamondNode, PentagonNode, HexagonNode, OctagonNode } from './PolygonNode';

/**
 * Options for creating a node via factory
 */
export interface CreateNodeOptions {
  data: NodeData;
  style?: NodeStyle;
  interactive?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  registry: Registry;
}

/**
 * Create a node shape based on the shape type in data
 * 
 * @param options - Node creation options
 * @returns The appropriate node shape instance
 */
export function createNode(options: CreateNodeOptions): NodeShapeBase {
  const shapeType = options.data.shape ?? 'circle';
  
  switch (shapeType) {
    case 'circle':
      return new CircleNode(options);
    
    case 'ellipse':
      return new EllipseNode(options);
    
    case 'rect':
    case 'rectangle':
    case 'square':
      return new RectNode(options);
    
    case 'roundedRect':
    case 'rounded-rect':
      return new RoundedRectNode(options);
    
    case 'triangle':
      return new TriangleNode(options);
    
    case 'diamond':
      return new DiamondNode(options);
    
    case 'pentagon':
      return new PentagonNode(options);
    
    case 'hexagon':
      return new HexagonNode(options);
    
    case 'octagon':
      return new OctagonNode(options);
    
    case 'polygon':
      return new PolygonNode({
        ...options,
        sides: (options.data as any).sides ?? 6,
      });
    
    default:
      // Default to circle for unknown types
      console.warn(`Unknown node shape type: ${shapeType}, defaulting to circle`);
      return new CircleNode(options);
  }
}
