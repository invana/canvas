/**
 * Types for the TextResolutionLODBehaviour editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `TextResolutionLODBehaviour` and
 * its options) is **not** imported for its runtime — the editable option shape
 * is mirrored here as {@link TextResolutionLODOptions}, a serialisable patch
 * the consumer applies via `setOptions`. Keep it in sync with
 * `TextResolutionLODBehaviourOptions` by hand.
 */

/**
 * The subset of `TextResolutionLODBehaviourOptions` this editor produces — a
 * serialisable patch. Only the scalar knobs round-trip.
 *
 * **`levels[]` is omitted on purpose.** The discrete `{ minZoom, multiplier }`
 * tier array is structural (an array of objects) and has no `FieldType` in the
 * form generator — it stays out of the form and is left untouched on
 * `setOptions`. The base `id` / `targetLayerId` / `enabled` / `shortcuts` are
 * likewise out of scope.
 */
export interface TextResolutionLODOptions {
  /**
   * Base resolution multiplied by the active tier's multiplier. Default
   * `window.devicePixelRatio`.
   */
  baseResolution?: number;
  /**
   * Hysteresis applied to downward tier changes — prevents flicker at a tier
   * boundary. Default `0.1`.
   */
  hysteresis?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link TextResolutionLODOptions} 1:1 — both fields are numbers.
 */
export type TextResolutionLODFields = TextResolutionLODOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface TextResolutionLODFormState {
  options: TextResolutionLODFields;
}
