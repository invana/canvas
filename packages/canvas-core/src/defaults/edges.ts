/**
 * Default edge configuration
 * Centralized defaults for all edge-related styles, dimensions, and behavior
 */

import type { EdgeStyle } from '../elements/edges/RendererEdgeBase';
import { EdgeStates } from '../types/states';

// ============================================================================
// State-Based Styling
// ============================================================================

/**
 * Default state styles for edges
 * Applied automatically when states are activated
 */
export const DEFAULT_EDGE_STATE_STYLES: Record<string, Partial<EdgeStyle>> = {
  [EdgeStates.DEFAULT]: {
    // Empty - top-level style properties serve as the base
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
    strokeWidth: 1,
    strokeAlpha: 0.3,
  },
  
  [EdgeStates.DISABLED]: {
    stroke: '#e8e8e8',
    strokeWidth: 1,
    strokeAlpha: 0.3,
  },
};

/**
 * Default state priority order for edges
 */
export const DEFAULT_EDGE_STATE_PRIORITY = [
  EdgeStates.DEFAULT,
  EdgeStates.MUTED,
  EdgeStates.DISABLED,
  EdgeStates.HIGHLIGHTED,
  EdgeStates.ACTIVE,
  EdgeStates.SELECTED,
];

// ============================================================================
// Complete Edge Style (Single Source of Truth)
// ============================================================================

/**
 * Complete default edge style
 * All edge styling in one place: path, arrows, label, states
 */
export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  // Path styling
  stroke: '#8c8c8c',
  strokeWidth: 2,
  strokeAlpha: 1,
  strokeStyle: 'solid',
  strokeDashPattern: undefined,
  strokeDashOffset: 0,
  strokeAlignment: 0.5,
  strokeCap: 'round',
  lineCap: 'round',
  lineJoin: 'round',
  visible: true,
  alpha: 1,
  cursor: 'pointer',
  
  // Arrow configuration
  arrowFill: undefined, // Uses edge stroke color by default
  arrowStroke: undefined,
  
  // Routing
  cornerRadius: 8,
  
  // State-based overrides
  states: DEFAULT_EDGE_STATE_STYLES,
};


