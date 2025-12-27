/**
 * Default node styling configuration
 * These styles are applied automatically unless overridden by user
 */

import type { ShapeStyle } from '../primitives/shapes';
import { NodeStates } from '../types/states';

/**
 * Default state styles for nodes
 * Applied automatically when states are activated
 */
export const DEFAULT_NODE_STATE_STYLES: Record<string, Partial<ShapeStyle>> = {
  [NodeStates.DEFAULT]: {
    fill: 0x27c554,
    stroke: '#525252',
    strokeWidth: 5,
    fillAlpha: 1,
    strokeAlpha: 1,
  },
  
  [NodeStates.ACTIVE]: {
    strokeWidth: 12,
    strokeAlpha: 0.35,
  },
  
  [NodeStates.SELECTED]: {
    strokeWidth: 12,
    strokeAlpha: 0.35,
  },
  
  [NodeStates.HIGHLIGHTED]: {
    stroke: '#98f45f',
    strokeWidth: 6,
    strokeAlpha: 0.5,
  },
  
  [NodeStates.DISABLED]: {
    fill: 0xd9d9d9,
    stroke: '#bfbfbf',
    strokeWidth: 1,
    fillAlpha: 1,
  },
  
  [NodeStates.MUTED]: {
    strokeWidth: 5,
    strokeAlpha: 0.5,
    fillAlpha: 0.5,
  }
};

/**
 * Merge user-provided state styles with defaults
 * User styles take precedence over defaults
 */
export function mergeNodeStateStyles(
  userStates?: Record<string, Partial<ShapeStyle>>
): Record<string, Partial<ShapeStyle>> {
  if (!userStates) {
    return { ...DEFAULT_NODE_STATE_STYLES };
  }

  const merged: Record<string, Partial<ShapeStyle>> = { ...DEFAULT_NODE_STATE_STYLES };

  // Merge user states over defaults
  for (const [state, style] of Object.entries(userStates)) {
    if (merged[state]) {
      merged[state] = { ...merged[state], ...style };
    } else {
      merged[state] = style;
    }
  }

  return merged;
}
