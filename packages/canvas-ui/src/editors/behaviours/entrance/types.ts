/**
 * Types for the EntranceBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `EntranceBehaviour` and its
 * options live) is **not** imported. {@link EntranceOptions} mirrors the
 * editable subset of `EntranceBehaviourOptions` structurally — keep it in sync
 * by hand.
 */

/** Which axis the sweep runs along. `'none'` fades everything together. */
export type EntranceOrderOption = 'x' | 'y' | 'none';

/** Named easing curves the engine accepts — mirrors `EasingName`. */
export type EntranceEasingOption =
  | 'linear'
  | 'easeInOutSine'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeOutQuad';

/**
 * The subset of `EntranceBehaviourOptions` this editor produces — a
 * serialisable patch. Base fields (`id` / `targetLayerId` / `enabled` /
 * `shortcuts`) are out of scope; only the user-tunable scalars and enums
 * round-trip.
 */
export interface EntranceOptions {
  durationMs?: number;
  staggerMs?: number;
  maxStaggerMs?: number;
  order?: EntranceOrderOption;
  includeEdges?: boolean;
  easing?: EntranceEasingOption;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * options are already flat scalars/enums, so this is a 1:1 mirror — the mapping
 * exists to keep the editor's contract independent of the engine's, the way
 * every other editor in this folder does.
 */
export interface EntranceFields {
  durationMs?: number;
  staggerMs?: number;
  maxStaggerMs?: number;
  order?: EntranceOrderOption;
  includeEdges?: boolean;
  easing?: EntranceEasingOption;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface EntranceFormState {
  options: EntranceFields;
}
