/**
 * Types for the EraseBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `EraseBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link EraseOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `EraseBehaviourOptions` by hand.
 */

/** Which element kinds the eraser removes. Mirrors the engine's `EraseTargetKind`. */
export type EraseTargetKind = 'node' | 'edge' | 'both';

/**
 * The serialisable subset of `EraseBehaviourOptions` this editor produces. The
 * `onErase` **callback** and the base `targetLayerId` / `enabled` / `shortcuts`
 * are out of scope; only the `target` enum round-trips.
 */
export interface EraseOptions {
  target?: EraseTargetKind;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders — one `target`
 * select. 1:1 with {@link EraseOptions} (no nesting to flatten).
 */
export interface EraseFields {
  target?: EraseTargetKind;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface EraseFormState {
  options: EraseFields;
}
