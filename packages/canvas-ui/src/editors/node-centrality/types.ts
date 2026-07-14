/**
 * Types for the NodeCentralityBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `NodeCentralityBehaviour` and
 * its options live) is **not** imported for its runtime — canvas-ui mirrors the
 * editable option shape here as {@link NodeCentralityOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived, so keep it in sync with `NodeCentralityBehaviourOptions` by hand.
 */

/** Which incident edges are counted toward a node's degree. */
export type NodeCentralityDirection = 'in' | 'out' | 'both';

/** Curve mapping normalized degree (0..1) → a size between min and max. */
export type NodeCentralityScale = 'linear' | 'sqrt' | 'log';

/**
 * The subset of `NodeCentralityBehaviourOptions` this editor produces — a
 * serialisable patch. The `sizeFn` callback override and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
 * only the user-tunable scalars round-trip.
 */
export interface NodeCentralityOptions {
  /** Edges counted per node: `'in'`, `'out'`, or `'both'` (default). */
  direction?: NodeCentralityDirection;
  /** Output `style.size` for a degree-0 node. Default `8`. */
  minSize?: number;
  /** Output `style.size` for the max-degree node. Default `32`. */
  maxSize?: number;
  /** Curve applied to normalized degree. Default `'sqrt'`. */
  scale?: NodeCentralityScale;
  /** Numeric edge-`data` field to sum for weighted degree (e.g. `'weight'`). Blank = raw count. */
  weightKey?: string;
  /** Scale the label with the node: labelFontSize = clamp(size × this, …). 0/blank = off. */
  labelScale?: number;
  /** Lower clamp for the scaled label font. Default `8`. */
  labelMinSize?: number;
  /** Upper clamp for the scaled label font. Default `40`. */
  labelMaxSize?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link NodeCentralityOptions} 1:1 — all scalar / enum, no re-encoding needed.
 */
export type NodeCentralityFields = NodeCentralityOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface NodeCentralityFormState {
  options: NodeCentralityFields;
}
