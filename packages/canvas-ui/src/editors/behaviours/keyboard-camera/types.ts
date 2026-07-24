/**
 * Types for the KeyboardCameraInputBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where
 * `KeyboardCameraInputBehaviour` and its options live) is **not** imported —
 * canvas-ui may only use `@invana/graph` types (see package CLAUDE.md). So the
 * editable option shape is mirrored here as {@link KeyboardCameraOptions}, a
 * plain serialisable patch the consumer applies via `setOptions`. The mirror is
 * structural, not derived, so it can't `Pick` from the engine — keep it in sync
 * with `KeyboardCameraInputBehaviourOptions` by hand.
 */

/**
 * The subset of `KeyboardCameraInputBehaviourOptions` this editor produces — a
 * serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
 * fields are out of scope, and the structural `keymap` object is omitted (too
 * nested for a form); only the tunable scalars round-trip.
 */
export interface KeyboardCameraOptions {
  /** Pan distance per key press in screen pixels. */
  panStep?: number;
  /** Zoom multiplier per key press. `1.1` = 10% in/out per press. */
  zoomFactor?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders.
 * `KeyboardCameraOptions` has no nesting or unions, so this mirrors it 1:1.
 */
export interface KeyboardCameraFields {
  panStep?: number;
  zoomFactor?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface KeyboardCameraFormState {
  options: KeyboardCameraFields;
}
