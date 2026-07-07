/**
 * Types for the PinchZoomBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `PinchZoomBehaviour` and
 * its options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link PinchZoomOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The mirror is structural, not derived, so it can't `Pick`
 * from the engine — keep it in sync with `PinchZoomBehaviourOptions` by hand.
 */

/**
 * The subset of `PinchZoomBehaviourOptions` this editor produces — a
 * serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
 * fields are out of scope; only the user-tunable scalars round-trip.
 */
export interface PinchZoomOptions {
  /** If `true`, suppress the implicit pan that accompanies a pinch gesture. */
  noDrag?: boolean;
  /** Zoom speed multiplier. */
  percent?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. `PinchZoomOptions`
 * has no nesting or unions, so this mirrors it 1:1.
 */
export interface PinchZoomFields {
  noDrag?: boolean;
  percent?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface PinchZoomFormState {
  options: PinchZoomFields;
}
