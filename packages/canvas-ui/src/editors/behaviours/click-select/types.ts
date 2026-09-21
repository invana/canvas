/**
 * Types for the ClickSelectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ClickSelectBehaviour` and
 * its options live) is **not** imported for values — canvas-ui may only use
 * `@invana/graph` types (see package CLAUDE.md), and here even the option shape
 * is mirrored structurally rather than derived, so it can't `Pick` from the
 * engine. Keep {@link ClickSelectOptions} in sync with
 * `ClickSelectBehaviourOptions` by hand.
 */

/** Modifier-key names accepted by the behaviour's `trigger` gate. */
export type ClickSelectModifierKey = 'shift' | 'control' | 'alt' | 'meta';

/** Neighbour-traversal direction. Mirror of the engine's `SelectDirection`. */
export type ClickSelectDirection = 'in' | 'out' | 'both';

/**
 * Which group frames a click can never select (mirrors the engine enum).
 * `'expanded'` is the engine default: an open frame is scenery, a collapsed
 * one selects like an ordinary node.
 */
export type ClickSelectGroupExclusion = 'expanded' | 'always' | 'never';

/**
 * The subset of `ClickSelectBehaviourOptions` this editor produces — a
 * serialisable patch. Callback options (`onSelect` / `onDeselect` /
 * `onSelectionChange`), the `enable` predicate, and base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
 * user-tunable scalars/enums round-trip. `trigger` keeps the engine's
 * `SelectModifierKey[]` encoding.
 */
export interface ClickSelectOptions {
  excludeNodeTypes?: string[];
  excludeGroups?: ClickSelectGroupExclusion;
  excludeEdgeTypes?: string[];
  multiple?: boolean;
  trigger?: ClickSelectModifierKey[];
  degree?: number;
  direction?: ClickSelectDirection;
  state?: string;
  unselectedState?: string;
  raiseActive?: boolean;
  clearOnBackground?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `trigger: SelectModifierKey[]` array is collapsed to a single `trigger`
 * select (`'none'` = no modifier gate); a UI can't express arbitrary modifier
 * combos and they're rarely used (see `mapping.ts`).
 */
export interface ClickSelectFields {
  /** Comma-separated `GraphNode.type` list — encoded, see `mapping.ts`. */
  excludeNodeTypes?: string;
  /** Structural group veto — a plain enum, no encoding. */
  excludeGroups?: ClickSelectGroupExclusion;
  /** Comma-separated `GraphEdge.type` list — encoded, see `mapping.ts`. */
  excludeEdgeTypes?: string;
  multiple?: boolean;
  /** Single modifier gate. `'none'` maps to the engine's empty `trigger` array. */
  trigger?: 'none' | ClickSelectModifierKey;
  degree?: number;
  direction?: ClickSelectDirection;
  state?: string;
  unselectedState?: string;
  raiseActive?: boolean;
  clearOnBackground?: boolean;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ClickSelectFormState {
  options: ClickSelectFields;
}
