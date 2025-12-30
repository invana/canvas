/**
 * StyleResolver - Function-based styling evaluator (AntV G6 style)
 * 
 * Evaluates style properties that can be functions receiving node/edge data
 */

import type { NodeData as NodeShapeData, NodeStyle } from '../elements/nodes';
import type { EdgeData as EdgeShapeData, EdgeStyle } from '../elements/edges';

/**
 * Type for style properties that can be static values or functions
 */
export type StyleValue<T, D = any> = T | ((data: D) => T);

/**
 * Style configuration with function-based properties (AntV G6 style)
 * Regular style properties can be functions that receive node data
 * Special properties like states, statePriority, labelStyle are kept as-is
 */
export type FunctionBasedNodeStyle<D = NodeShapeData> = {
  [K in keyof Omit<NodeStyle, 'states' | 'statePriority' | 'labelStyle'>]?: 
    NodeStyle[K] extends infer V ? (V | ((data: D) => V)) : never;
} & Pick<NodeStyle, 'states' | 'statePriority' | 'labelStyle'>;

export type FunctionBasedEdgeStyle<D = EdgeShapeData> = {
  [K in keyof EdgeStyle]?: StyleValue<EdgeStyle[K], D>;
};

/**
 * Evaluate function-based node styles
 * 
 * @param nodeData - The node shape data (id, x, y, label, payload, etc.)
 * @param globalStyle - Global default style (may contain functions)
 * @param individualStyle - Individual node style (may contain functions)
 * @returns Resolved style with all functions evaluated
 */
export function evaluateNodeStyle(
  nodeData: NodeShapeData,
  globalStyle?: Partial<FunctionBasedNodeStyle>,
  individualStyle?: Partial<FunctionBasedNodeStyle>
): Partial<NodeStyle> {
  // Merge styles in order: global → individual
  const mergedStyle: Partial<FunctionBasedNodeStyle> = {
    ...globalStyle,
    ...individualStyle,
  };

  // Evaluate all function-based properties
  const resolvedStyle: any = {};

  for (const [key, value] of Object.entries(mergedStyle)) {
    if (key === 'states') {
      // States object is not evaluated - merge as-is
      resolvedStyle.states = {
        ...globalStyle?.states,
        ...individualStyle?.states,
      };
    } else if (key === 'statePriority') {
      // Priority array is not evaluated
      resolvedStyle.statePriority = value;
    } else if (key === 'labelStyle') {
      // Label style - merge as-is (can be enhanced later to support functions)
      resolvedStyle.labelStyle = {
        ...globalStyle?.labelStyle,
        ...individualStyle?.labelStyle,
      };
    } else if (typeof value === 'function') {
      // Evaluate function with node data
      resolvedStyle[key] = value(nodeData);
    } else {
      // Static value
      resolvedStyle[key] = value;
    }
  }

  return resolvedStyle as Partial<NodeStyle>;
}

/**
 * Evaluate function-based edge styles
 * 
 * @param edgeData - The edge shape data
 * @param globalStyle - Global default style (may contain functions)
 * @param individualStyle - Individual edge style (may contain functions)
 * @returns Resolved style with all functions evaluated
 */
export function evaluateEdgeStyle(
  edgeData: EdgeShapeData,
  globalStyle?: Partial<FunctionBasedEdgeStyle>,
  individualStyle?: Partial<FunctionBasedEdgeStyle>
): Partial<EdgeStyle> {
  const mergedStyle: Partial<FunctionBasedEdgeStyle> = {
    ...globalStyle,
    ...individualStyle,
  };

  const resolvedStyle: any = {};

  for (const [key, value] of Object.entries(mergedStyle)) {
    if (typeof value === 'function') {
      resolvedStyle[key] = value(edgeData);
    } else {
      resolvedStyle[key] = value;
    }
  }

  return resolvedStyle as Partial<EdgeStyle>;
}
