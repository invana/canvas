/**
 * Edge Factory
 * 
 * Factory function to create the appropriate edge shape based on path type.
 */

import type { Registry } from '../../canvas/Registry';
import type { EdgeData, EdgeStyle } from './EdgeShapeBase';
import { EdgeShapeBase } from './EdgeShapeBase';
import { LineEdge } from './LineEdge';
import { BezierEdge } from './BezierEdge';
import { OrthogonalEdge, OrthogonalRoundedEdge } from './OrthogonalEdge';

/**
 * Options for creating an edge via factory
 */
export interface CreateEdgeOptions {
  data: Omit<EdgeData, 'x' | 'y'> & { x?: number; y?: number };
  style?: EdgeStyle;
  registry: Registry;
}

/**
 * Create an edge shape based on the path type in data
 * 
 * @param options - Edge creation options
 * @returns The appropriate edge shape instance
 */
export function createEdge(options: CreateEdgeOptions): EdgeShapeBase {
  const pathType = options.data.pathType ?? 'line';
  
  switch (pathType) {
    case 'line':
    case 'straight':
      return new LineEdge(options);
    
    case 'bezier':
    case 'curved':
    case 'quadratic':
      return new BezierEdge(options);
    
    case 'orthogonal':
      return new OrthogonalEdge(options);
    
    case 'orthogonal-rounded':
      return new OrthogonalRoundedEdge(options);
    
    default:
      // Default to line for unknown types
      console.warn(`Unknown edge path type: ${pathType}, defaulting to line`);
      return new LineEdge(options);
  }
}
