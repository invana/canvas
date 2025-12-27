/**
 * Default edge configuration
 * Centralized defaults for all edge-related styles, dimensions, and behavior
 * 
 * This provides a single source of truth for:
 * - Path styles (stroke, dashing, caps)
 * - Arrow styles and types
 * - Label styles and positioning
 * - State-based styling
 * - Routing and corner behavior
 */

import type { EdgeStyle } from '../elements/edges/EdgeShapeBase';
import { EdgeStates } from '../types/states';
import { DEFAULT_LABEL_STYLE } from './labels';
import type { ArrowType } from '../primitives/arrows';

// ============================================================================
// Core Edge Defaults
// ============================================================================

/**
 * Default edge path style (base appearance)
 */
export const DEFAULT_EDGE_PATH_STYLE = {
  stroke: '#8c8c8c',
  strokeWidth: 2,
  strokeAlpha: 1,
  strokeStyle: 'solid' as const,
  strokeDashPattern: undefined,
  strokeDashOffset: 0,
  strokeAlignment: 0.5, // Centered on path
  strokeCap: 'round' as const,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  visible: true,
  alpha: 1,
  cursor: 'pointer',
};

/**
 * Default arrow configuration
 */
export const DEFAULT_EDGE_ARROW = {
  type: 'triangle' as ArrowType,
  size: 10,
  fill: undefined, // Uses edge stroke color by default
  stroke: undefined,
  sourceArrow: undefined as ArrowType | undefined,
  targetArrow: 'triangle' as ArrowType,
};

/**
 * Default edge routing configuration
 */
export const DEFAULT_EDGE_ROUTING = {
  cornerRadius: 8,
  controlPointDistance: 100,
  curvature: 0.5,
};

/**
 * Default label configuration for edges
 */
export const DEFAULT_EDGE_LABEL = {
  style: {
    ...DEFAULT_LABEL_STYLE,
    fontSize: 10,
    fill: '#666666',
  },
  position: 0.5, // Middle of edge
  offset: { x: 0, y: -10 }, // Slightly above edge
};

// ============================================================================
// State-Based Styling
// ============================================================================

/**
 * Default state styles for edges
 * Applied automatically when states are activated
 */
export const DEFAULT_EDGE_STATE_STYLES: Record<string, Partial<EdgeStyle>> = {
  [EdgeStates.DEFAULT]: {
    ...DEFAULT_EDGE_PATH_STYLE,
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
// Complete Edge Style (All Options Combined)
// ============================================================================

/**
 * Complete default edge style with all options
 * This is the full configuration that can be used as a base
 */
export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  // Path styles
  ...DEFAULT_EDGE_PATH_STYLE,
  
  // Arrow configuration
  arrowFill: DEFAULT_EDGE_ARROW.fill,
  arrowStroke: DEFAULT_EDGE_ARROW.stroke,
  
  // Routing
  cornerRadius: DEFAULT_EDGE_ROUTING.cornerRadius,
  
  // State-based overrides
  states: DEFAULT_EDGE_STATE_STYLES,
};

// ============================================================================
// Interactive Behavior Defaults
// ============================================================================

/**
 * Default interactive behavior settings for edges
 */
export const DEFAULT_EDGE_BEHAVIOR = {
  selectable: true,
  hoverable: true,
  clickable: true,
  cursor: 'pointer',
};

// ============================================================================
// Stroke Style Presets
// ============================================================================

/**
 * Common stroke patterns for quick styling
 */
export const EDGE_STROKE_PRESETS = {
  solid: {
    strokeStyle: 'solid' as const,
    strokeDashPattern: undefined,
  },
  dashed: {
    strokeStyle: 'dashed' as const,
    strokeDashPattern: [10, 5],
  },
  dotted: {
    strokeStyle: 'dotted' as const,
    strokeDashPattern: [2, 4],
  },
  dashedLong: {
    strokeStyle: 'dashed' as const,
    strokeDashPattern: [20, 10],
  },
  dashedDotted: {
    strokeStyle: 'dashed' as const,
    strokeDashPattern: [10, 5, 2, 5],
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

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

/**
 * Merge user edge style with complete defaults
 * Creates a full EdgeStyle object with all properties defined
 */
export function mergeEdgeStyle(
  userStyle?: Partial<EdgeStyle>
): EdgeStyle {
  if (!userStyle) {
    return { ...DEFAULT_EDGE_STYLE };
  }

  return {
    ...DEFAULT_EDGE_STYLE,
    ...userStyle,
    // Deep merge states
    states: userStyle.states
      ? mergeEdgeStateStyles(userStyle.states)
      : DEFAULT_EDGE_STATE_STYLES,
  };
}
