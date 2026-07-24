/**
 * Types for the ContextMenuBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ContextMenuBehaviour` and
 * its options live) is **not** imported for values — canvas-ui mirrors the
 * editable option shape here as {@link ContextMenuOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived; keep it in sync with `ContextMenuBehaviourOptions` by hand.
 */

/** Which kind of target a context-menu gesture landed on. */
export type ContextMenuTargetType = 'node' | 'edge' | 'canvas';

/**
 * The serialisable subset of `ContextMenuBehaviourOptions` this editor produces.
 * The `onContextMenu` **callback** and the base
 * `targetLayerId` / `enabled` / `shortcuts` are out of scope. `targets` (the
 * allowed target kinds) and `state` (a transient state name) round-trip;
 * `targets` is stored structurally as its array here but flattened to three
 * booleans in the form — see {@link ContextMenuFields}.
 */
export interface ContextMenuOptions {
  targets?: ContextMenuTargetType[];
  /** Transient state name applied to the right-clicked node/edge, or `null` to disable. */
  state?: string | null;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The `targets`
 * array is flattened into one boolean per kind (`FieldType` has no array), and
 * `state` renders as a text input.
 */
export interface ContextMenuFields {
  /** Fire on right-clicking a node (`targets` includes `'node'`). */
  targetNode?: boolean;
  /** Fire on right-clicking an edge (`targets` includes `'edge'`). */
  targetEdge?: boolean;
  /** Fire on right-clicking empty canvas (`targets` includes `'canvas'`). */
  targetCanvas?: boolean;
  /** Transient state name applied to the right-clicked element. Empty = none. */
  state?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ContextMenuFormState {
  options: ContextMenuFields;
}
