// ── Default States ────────────────────────────────────────────────────────────
// Built-in state set applied as fallback by BaseShape.resolveStyle() and
// BaseConnector.resolveStyle() when a state is active but the spec does not
// provide its own override for that state.
//
// User-supplied spec.states[name] always wins over these defaults — they are
// only consulted when the spec has no entry for the active state name.
//
// State semantics
//   hovered   — auto on pointer enter
//   selected  — user click selection
//   active    — currently interacting element
//   highlight — emphasis / focus
//   inactive  — dimmed / unfocused
//   disabled  — non-interactive

import type { DrawStyle, PathStyle } from './spec/index.js';

/** Default state overrides for shapes ({@link BaseShape}). */
export const DEFAULT_NODE_STATES: Record<string, DrawStyle> = {
  hovered:   { fill: '#0ea5e9', stroke: '#ffffff', strokeWidth: 3 },
  selected:  { fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 4 },
  active:    { fill: '#059669', stroke: '#6ee7b7', strokeWidth: 3 },
  highlight: { fill: '#d97706', stroke: '#fde68a', strokeWidth: 3 },
  inactive:  { fill: '#1e293b', stroke: '#475569', strokeWidth: 1, fillAlpha: 0.45 },
  disabled:  { fill: '#0f172a', stroke: '#334155', strokeWidth: 1, fillAlpha: 0.25 },
};

/** Default state overrides for connectors ({@link BaseConnector}). */
export const DEFAULT_EDGE_STATES: Record<string, PathStyle> = {
  hovered:   { stroke: '#0ea5e9', strokeWidth: 3 },
  selected:  { stroke: '#7c3aed', strokeWidth: 4 },
  active:    { stroke: '#059669', strokeWidth: 3 },
  highlight: { stroke: '#d97706', strokeWidth: 3 },
  inactive:  { strokeAlpha: 0.4 },
  disabled:  { strokeAlpha: 0.2 },
};
