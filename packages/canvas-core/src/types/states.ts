/**
 * Node State Constants
 * 
 * Predefined state names for type-safe state management.
 * Use these constants to avoid typos and enable autocomplete.
 * 
 * @example
 * ```typescript
 * node.setState(NodeStates.SELECTED, true);
 * node.setState(NodeStates.LOADING, true);
 * ```
 */

export const NodeStates = {
  /** Default state (always active) */
  DEFAULT: 'default',
  /** Node is selected */
  SELECTED: 'selected',
  /** Node is active (mouse over/hover) */
  ACTIVE: 'active',
  /** Node is being dragged */
  DRAGGING: 'dragging',
  /** Node is highlighted */
  HIGHLIGHTED: 'highlighted',
  /** Node is muted */
  MUTED: 'muted',
  /** Node is disabled/inactive */
  DISABLED: 'disabled',
//   /** Node is in loading state */
//   LOADING: 'loading',
//   /** Node has an error */
//   ERROR: 'error',
//   /** Node is in warning state */
//   WARNING: 'warning',
//   /** Node is in success state */
//   SUCCESS: 'success',
//   /** Node is focused */
//   FOCUSED: 'focused',
} as const;

export type NodeStateName = typeof NodeStates[keyof typeof NodeStates] | string;

/**
 * Edge State Constants
 */
export const EdgeStates = {
  /** Default state (always active) */
  DEFAULT: 'default',
  /** Edge is selected */
  SELECTED: 'selected',
  /** Edge is active (mouse over/hover) */
  ACTIVE: 'active',
  /** Edge is highlighted */
  HIGHLIGHTED: 'highlighted',
  /** Edge is muted */
  MUTED: 'muted',
  /** Edge is disabled/inactive */
  DISABLED: 'disabled',
} as const;

export type EdgeStateName = typeof EdgeStates[keyof typeof EdgeStates] | string;

/**
 * Known state names for validation and suggestions
 * @internal
 */
export const KNOWN_NODE_STATES = new Set(Object.values(NodeStates));
export const KNOWN_EDGE_STATES = new Set(Object.values(EdgeStates));
