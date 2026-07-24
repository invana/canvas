/**
 * Types for the LabelCollisionBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `LabelCollisionBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link LabelCollisionOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `LabelCollisionBehaviourOptions` by hand.
 */

/** What the behaviour does with an overlap. `'hide'` is the only strategy in v0. */
export type LabelCollisionStrategy = 'hide';

/**
 * How label priority is resolved when sorting. The engine also accepts a
 * `(kind, id) => number` callback, which is out of scope for the form — only
 * the two string modes round-trip.
 */
export type LabelPriorityMode = 'priority-field' | 'node-degree';

/**
 * The subset of `LabelCollisionBehaviourOptions` this editor produces — a
 * serialisable patch. The `prioritise` callback form and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope. The
 * engine's nested `groups: { nodes?, edges? }` is flattened to
 * `groupNodes` / `groupEdges` for the form and re-nested on the way out
 * (see `mapping.ts`).
 */
export interface LabelCollisionOptions {
  /** Overlap resolution strategy. Default `'hide'`. */
  strategy?: LabelCollisionStrategy;
  /** How priority is resolved when sorting. Default `'priority-field'`. */
  prioritise?: LabelPriorityMode;
  /** Minimum ms a just-flipped label holds before it can flip back. Default `100`. */
  flickerGuardMs?: number;
  /** Collision group name assigned to node labels. Default `'nodes'`. */
  groups?: {
    nodes?: string;
    edges?: string;
  };
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * nested `groups` object is split into two flat text fields (`groupNodes` /
 * `groupEdges`) — a single field can't edit a nested object (see `mapping.ts`).
 */
export interface LabelCollisionFields {
  strategy?: LabelCollisionStrategy;
  prioritise?: LabelPriorityMode;
  flickerGuardMs?: number;
  /** Flattened `groups.nodes`. */
  groupNodes?: string;
  /** Flattened `groups.edges`. */
  groupEdges?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface LabelCollisionFormState {
  options: LabelCollisionFields;
}
