/**
 * Types for the EdgeScaleLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `EdgeScaleLODBehaviour` and its
 * options) is **not** imported for its runtime — the editable option shape is
 * mirrored here as {@link EdgeScaleLODOptions}, a serialisable patch the
 * consumer applies via `setOptions`. Keep it in sync with
 * `EdgeScaleLODBehaviourOptions` (and its `ElementScaleLODBehaviourOptions` base)
 * by hand.
 */

/**
 * The subset of `EdgeScaleLODBehaviourOptions` this editor produces — a
 * serialisable patch. Only the base `ElementScaleLODBehaviourOptions` scalars
 * (`scaleEpsilon`, `settleMs`) round-trip.
 *
 * **`layers[]` is omitted on purpose.** The per-`GraphLayer` config array
 * (`{ targetLayerId, strokeWidthPx }[]`, each entry potentially a getter) is
 * structural and identity-bearing, with no `FieldType` in the form generator —
 * it stays out of the form and is left untouched on `setOptions`.
 */
export interface EdgeScaleLODOptions {
  /**
   * Skip the per-frame apply when the relative scale change is below this
   * threshold. Default `0.005` (0.5%).
   */
  scaleEpsilon?: number;
  /**
   * When `> 0`, debounce the apply to a trailing edge `settleMs` after zoom
   * silence instead of running per RAF frame. Default `80` for this behaviour.
   */
  settleMs?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link EdgeScaleLODOptions} 1:1 — both fields are numbers.
 */
export type EdgeScaleLODFields = EdgeScaleLODOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface EdgeScaleLODFormState {
  options: EdgeScaleLODFields;
}
