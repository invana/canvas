/**
 * Types for the DegreeSizeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `DegreeSizeBehaviour` and
 * its options live) is **not** imported for its runtime — canvas-ui mirrors the
 * editable option shape here as {@link DegreeSizeOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived, so keep it in sync with `DegreeSizeBehaviourOptions` by hand.
 */

/** Which incident edges are counted toward a node's degree. */
export type DegreeSizeDirection = 'in' | 'out' | 'both';

/** Curve mapping normalized degree (0..1) → a size between min and max. */
export type DegreeSizeScale = 'linear' | 'sqrt' | 'log';

/**
 * The subset of `DegreeSizeBehaviourOptions` this editor produces — a
 * serialisable patch. The `sizeFn` callback override and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
 * only the user-tunable scalars round-trip.
 */
export interface DegreeSizeOptions {
  /** Edges counted per node: `'in'`, `'out'`, or `'both'` (default). */
  direction?: DegreeSizeDirection;
  /** Output `style.size` for a degree-0 node. Default `8`. */
  minSize?: number;
  /** Output `style.size` for the max-degree node. Default `32`. */
  maxSize?: number;
  /** Curve applied to normalized degree. Default `'sqrt'`. */
  scale?: DegreeSizeScale;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link DegreeSizeOptions} 1:1 — all scalar / enum, no re-encoding needed.
 */
export type DegreeSizeFields = DegreeSizeOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface DegreeSizeFormState {
  options: DegreeSizeFields;
}
