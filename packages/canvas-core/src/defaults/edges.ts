/**
 * Default edge styling configuration
 * These styles are applied automatically unless overridden by user
 */

import type { EdgeStyle } from '../elements/edges/EdgeShapeBase';
import { EdgeStates } from '../types/states';

/**
 * Default state styles for edges
 * Applied automatically when states are activated
 */
export const DEFAULT_EDGE_STATE_STYLES: Record<string, Partial<EdgeStyle>> = {
  [EdgeStates.DEFAULT]: {
    stroke: '#8c8c8c',
    strokeWidth: 2,
    strokeAlpha: 1,
  },
  
  [EdgeStates.ACTIVE]: {
    stroke: '#91d5ff',
    strokeWidth: 4,
    strokeAlpha: 0.8,
  },
  
  [EdgeStates.SELECTED]: {
    stroke: '#1890ff',
    strokeWidth: 4,
    strokeAlpha: 1,
  },
  
  [EdgeStates.HIGHLIGHTED]: {
    stroke: '#faad14',
    strokeWidth: 4,
    strokeAlpha: 1,
  },
  
  [EdgeStates.MUTED]: {
    strokeWidth: 0.5,
    strokeAlpha: 0.5,
  },
  
  [EdgeStates.DISABLED]: {
    stroke: '#e8e8e8',
    strokeWidth: 1,
    strokeAlpha: 0.3,
  },
};

/**
 * Merge user-provided state styles with defaults
 * User styles take precedence over defaults
 */
export function mergeEdgeStateStyles(
  userStates?: Record<string, Partial<EdgeStyle>>
): Record<string, Partial<EdgeStyle>> {
  if (!userStates) {
    return { ...DEFAULT_EDGE_STATE_STYLES };
  }

  const merged: Record<string, Partial<EdgeStyle>> = { ...DEFAULT_EDGE_STATE_STYLES };

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
