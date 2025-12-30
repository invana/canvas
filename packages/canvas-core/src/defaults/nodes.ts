/**
 * Default node configuration
 * Centralized defaults for all node-related styles, dimensions, and behavior
 */

import type { ShapeStyle } from '../primitives/shapes';
import { NodeStates } from '../types/states';
import { LABEL_VARIANTS } from './labels';
import type { NodeStyle } from '../elements/nodes/NodeShapeBase';

// ============================================================================
// State-Based Styling
// ============================================================================

/**
 * Default state styles for nodes
 * States are applied as overrides on top of base style
 */
export const DEFAULT_NODE_STATE_STYLES: Record<string, Partial<ShapeStyle>> = {
  [NodeStates.DEFAULT]: {
    // Empty - top-level style properties serve as the base
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
// Complete Node Style (Single Source of Truth)
// ============================================================================

/**
 * Complete default node style
 * All node styling in one place: shape, label, states, effects
 */
export const DEFAULT_NODE_STYLE: NodeStyle = {
  // Shape styling
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
  
  // Halo effect
  halo: false,
  haloStrokeWidth: 10,
  haloStroke: '#127dc5',
  haloStrokeOpacity: 0.25,
  
  // Label configuration
  labelPosition: 'center',
  labelOffsetX: 0,
  labelOffsetY: 0,
  labelStyle: { ...LABEL_VARIANTS.node },
  
  // Ripple effect
  rippleColor: '#1890ff',
  
  // State-based overrides
  states: DEFAULT_NODE_STATE_STYLES,
  statePriority: DEFAULT_NODE_STATE_PRIORITY,
};


