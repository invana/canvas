/**
 * Types for the ParallelEdgeBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `ParallelEdgeBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link ParallelEdgeOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `ParallelEdgeBehaviourOptions` by hand.
 */

/**
 * Axis along which a group of parallel edges spreads.
 *
 * - `'auto'` — derive per edge from its `pathType`.
 * - `'perpendicular'` — offset perpendicular to the source→target chord.
 * - `'axis-aligned'` — offset along the non-dominant axis.
 */
export type ParallelEdgeBasis = 'auto' | 'perpendicular' | 'axis-aligned';

/**
 * The subset of `ParallelEdgeBehaviourOptions` this editor produces — a
 * serialisable patch. The `groupBy` / `distribute` callbacks and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
 * only the user-tunable scalars round-trip.
 */
export interface ParallelEdgeOptions {
  /** Spacing between adjacent ranks in world units. Default `12`. */
  spacing?: number;
  /** Basis used to translate a rank into a fan direction. Default `'auto'`. */
  basis?: ParallelEdgeBasis;
  /**
   * When `true`, port-anchored edges also fan their endpoints along the host
   * face; when `false`, only waypoints are written. Default `true`.
   */
  anchorOffset?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link ParallelEdgeOptions} 1:1 — all scalar / enum / boolean.
 */
export type ParallelEdgeFields = ParallelEdgeOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ParallelEdgeFormState {
  options: ParallelEdgeFields;
}
