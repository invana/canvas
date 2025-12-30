/**
 * Node Factory
 * 
 * Factory function to create the appropriate node shape based on type.
 */

import type { Registry } from '../../rendering/Registry';
import type { RendererNode, NodeStyle } from './RendererNodeBase';
import { RendererNodeBase } from './RendererNodeBase';
import { CircleNode } from './CircleNode';

/**
 * Options for creating a node via factory
 */
export interface CreateNodeOptions {
  data: RendererNode;
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
export function createNode(options: CreateNodeOptions): RendererNodeBase {
  const shapeType = options.data.shape ?? 'circle';
  
  // Try to get the node class from registry first
  const NodeClass = options.registry.getNodeClass(shapeType);
  
  if (NodeClass) {
    return new NodeClass(options);
  }
  
  // Fallback: warn and use circle as default
  console.warn(`Unknown node shape type: ${shapeType}, defaulting to circle`);
  const CircleClass = options.registry.getNodeClass('circle');
  
  if (CircleClass) {
    return new CircleClass(options);
  }
  
  // Last resort: create a CircleNode directly (should not happen if registry is properly initialized)
  return new CircleNode(options);
}
