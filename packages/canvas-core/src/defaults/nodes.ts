/**
 * Default node configuration
 * Centralized defaults for all node-related styles, dimensions, and behavior
 * 
 * This provides a single source of truth for:
 * - Shape styles (fill, stroke, effects)
 * - Dimensions (width, height)
 * - Label styles and positioning
 * - State-based styling
 * - Interactive behavior
 */

import type { ShapeStyle } from '../primitives/shapes';
import type { LabelPosition } from '../primitives/labels';
import { NodeStates } from '../types/states';
import { DEFAULT_LABEL_STYLE, DEFAULT_LABEL_POSITION, DEFAULT_LABEL_OFFSET } from './labels';
import type { NodeStyle } from '../elements/nodes/NodeShapeBase';

// ============================================================================
// Core Node Defaults
// ============================================================================

/**
 * Default node dimensions
 */
export const DEFAULT_NODE_DIMENSIONS = {
  width: 40,
  height: 40,
  minWidth: 10,
  minHeight: 10,
  maxWidth: 500,
  maxHeight: 500,
} as const;

/**
 * Default node shape style (base appearance)
 * This is the foundational style applied to all nodes
 */
export const DEFAULT_NODE_SHAPE_STYLE: ShapeStyle = {
  fill: 0x27c554,
  fillAlpha: 1,
  stroke: '#525252',
  strokeWidth: 5,
  strokeAlpha: 1,
  strokeStyle: 'solid',
  strokeDashPattern: undefined,
  strokeDashOffset: 0,
  strokeAlignment: 0,
  strokeCap: 'round',
  halo: false,
  haloStrokeWidth: 10,
  haloStroke: '#127dc5',
  haloStrokeOpacity: 0.25,
};

/**
 * Default label configuration for nodes
 */
export const DEFAULT_NODE_LABEL = {
  position: DEFAULT_LABEL_POSITION as LabelPosition,
  offsetX: DEFAULT_LABEL_OFFSET.x,
  offsetY: DEFAULT_LABEL_OFFSET.y,
  style: { ...DEFAULT_LABEL_STYLE },
};

/**
 * Default badge configuration
 */
export const DEFAULT_NODE_BADGE = {
  fontSize: 10,
  fontWeight: 'bold' as const,
  fill: '#ffffff',
  background: 0xff4d4f,
  strokeWidth: 2,
  strokeColor: 0xffffff,
  padding: 4,
  borderRadius: 10,
};

/**
 * Default ripple effect configuration
 */
export const DEFAULT_NODE_RIPPLE = {
  color: '#1890ff',
  duration: 600,
  maxScale: 2,
  enabled: false,
};

// ============================================================================
// State-Based Styling
// ============================================================================

/**
 * Default state styles for nodes
 * DEFAULT state must be fully defined as it provides the base for all other states
 * Other states are Partial and extend from DEFAULT
 */
export const DEFAULT_NODE_STATE_STYLES: Record<string, Partial<ShapeStyle>> = {
  [NodeStates.DEFAULT]: {
    ...DEFAULT_NODE_SHAPE_STYLE,
  },
  
  [NodeStates.ACTIVE]: {
    strokeWidth: 5,
    strokeAlpha: 0.35,
    halo: true,
  },
  
  [NodeStates.SELECTED]: {
    strokeWidth: 5,
    strokeAlpha: 0.35,
    halo: true,
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
  },
};

/**
 * Default state priority order
 * States are applied in this order, later states override earlier ones
 */
export const DEFAULT_NODE_STATE_PRIORITY = [
  NodeStates.DEFAULT,
  NodeStates.MUTED,
  NodeStates.DISABLED,
  NodeStates.HIGHLIGHTED,
  NodeStates.ACTIVE,
  NodeStates.SELECTED,
  NodeStates.DRAGGING,
];

// ============================================================================
// Complete Node Style (All Options Combined)
// ============================================================================

/**
 * Complete default node style with all options
 * This is the full configuration that can be used as a base
 */
export const DEFAULT_NODE_STYLE: NodeStyle = {
  // Shape styles
  ...DEFAULT_NODE_SHAPE_STYLE,
  
  // Label configuration
  labelPosition: DEFAULT_NODE_LABEL.position,
  labelOffsetX: DEFAULT_NODE_LABEL.offsetX,
  labelOffsetY: DEFAULT_NODE_LABEL.offsetY,
  labelStyle: DEFAULT_NODE_LABEL.style,
  
  // Ripple effect
  rippleColor: DEFAULT_NODE_RIPPLE.color,
  
  // State-based overrides
  states: DEFAULT_NODE_STATE_STYLES,
  statePriority: DEFAULT_NODE_STATE_PRIORITY,
};

// ============================================================================
// Interactive Behavior Defaults
// ============================================================================

/**
 * Default interactive behavior settings
 */
export const DEFAULT_NODE_BEHAVIOR = {
  draggable: true,
  selectable: true,
  hoverable: true,
  clickable: true,
  cursor: 'pointer',
  cursorDragging: 'grabbing',
};

// ============================================================================
// Utility Functions
// ============================================================================

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

/**
 * Merge user node style with complete defaults
 * Creates a full NodeStyle object with all properties defined
 */
export function mergeNodeStyle(
  userStyle?: Partial<NodeStyle>
): NodeStyle {
  if (!userStyle) {
    return { ...DEFAULT_NODE_STYLE };
  }

  return {
    ...DEFAULT_NODE_STYLE,
    ...userStyle,
    // Deep merge label style
    labelStyle: userStyle.labelStyle 
      ? { ...DEFAULT_NODE_LABEL.style, ...userStyle.labelStyle }
      : DEFAULT_NODE_LABEL.style,
    // Deep merge states
    states: userStyle.states
      ? mergeNodeStateStyles(userStyle.states)
      : DEFAULT_NODE_STATE_STYLES,
    // Use user priority if provided, otherwise default
    statePriority: userStyle.statePriority ?? DEFAULT_NODE_STATE_PRIORITY,
  };
}
