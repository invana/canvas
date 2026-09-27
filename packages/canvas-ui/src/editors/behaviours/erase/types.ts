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
 * are out of scope; the `target` enum and the `modes` gate round-trip.
 */
export interface EraseOptions {
  target?: EraseTargetKind;
  /** Interaction modes the eraser is live in (`BehaviourOptions.modes`); `undefined` = every mode. */
  modes?: string[];
}

/**
 * Flat form-field shape the `@invana/forms` generator renders — a `target`
 * select and a `modes` checkbox group. 1:1 with {@link EraseOptions}.
 */
export interface EraseFields {
  target?: EraseTargetKind;
  /** Ticked modes; empty = every mode. */
  modes?: string[];
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface EraseFormState {
  options: EraseFields;
}
