/**
 * Function-Based Styling Utilities
 * 
 * Simple utility for AntV G6-style function-based properties
 * where style values can be static or functions that receive node/edge data
 */

import type { NodeData, NodeStyle } from '../elements/nodes';
import type { EdgeData, EdgeStyle } from '../elements/edges';

/**
 * Type for style properties that can be static values or functions
 */
export type StyleValue<T, D = any> = T | ((data: D) => T);

/**
 * Node style with function-based properties
 * ANY property can be a static value or a function(nodeData) => value
 */
export type FunctionBasedNodeStyle<D = NodeData> = {
  [K in keyof NodeStyle]?: NodeStyle[K] extends infer V ? (V | ((data: D) => V)) : never;
};

/**
 * Edge style with function-based properties
 */
export type FunctionBasedEdgeStyle<D = EdgeData> = {
  [K in keyof EdgeStyle]?: StyleValue<EdgeStyle[K], D>;
};

/**
 * Evaluate function-based node style properties
 * Merges default, user global, and individual node styles with deep merge for states
 * Priority: defaultStyle → userGlobalStyle → individualStyle (later overrides earlier)
 */
export function resolveNodeStyle(
  nodeData: NodeData,
  defaultStyle?: Partial<FunctionBasedNodeStyle>,
  userGlobalStyle?: Partial<FunctionBasedNodeStyle>,
  individualStyle?: Partial<FunctionBasedNodeStyle>
): Partial<NodeStyle> {
  // Deep merge: default → user → individual
  const merged: Partial<FunctionBasedNodeStyle> = {
    ...defaultStyle,
    ...userGlobalStyle,
    ...individualStyle,
  };

  // Deep merge states specifically (nested object)
  if (defaultStyle?.states || userGlobalStyle?.states || individualStyle?.states) {
    merged.states = {
      ...defaultStyle?.states,
      ...userGlobalStyle?.states,
      ...individualStyle?.states,
    };
  }

  // Deep merge statePriority
  if (!merged.statePriority && defaultStyle?.statePriority) {
    merged.statePriority = defaultStyle.statePriority;
  }

  // Evaluate all properties - simple and consistent
  const resolved: any = {};

  for (const [key, value] of Object.entries(merged)) {
    if (key === 'states') {
      // Handle nested states object - evaluate each state's properties
      const statesObj: any = {};
      for (const [stateName, stateStyle] of Object.entries(value as any)) {
        statesObj[stateName] = {};
        for (const [stateKey, stateValue] of Object.entries(stateStyle as any)) {
          if (typeof stateValue === 'function') {
            statesObj[stateName][stateKey] = stateValue(nodeData);
          } else {
            statesObj[stateName][stateKey] = stateValue;
          }
        }
      }
      resolved[key] = statesObj;
    } else if (typeof value === 'function') {
      // Evaluate function with node data
      resolved[key] = value(nodeData);
    } else {
      // Static value
      resolved[key] = value;
    }
  }

  return resolved as Partial<NodeStyle>;
}

/**
 * Evaluate function-based edge style properties
 */
export function resolveEdgeStyle(
  edgeData: EdgeData,
  globalStyle?: Partial<FunctionBasedEdgeStyle>,
  individualStyle?: Partial<FunctionBasedEdgeStyle>
): Partial<EdgeStyle> {
  const merged: Partial<FunctionBasedEdgeStyle> = {
    ...globalStyle,
    ...individualStyle,
  };

  const resolved: any = {};

  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === 'function') {
      resolved[key] = value(edgeData);
    } else {
      resolved[key] = value;
    }
  }

  return resolved as Partial<EdgeStyle>;
}
