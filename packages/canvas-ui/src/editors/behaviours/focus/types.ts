/**
 * Types for the FocusBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `FocusBehaviour` lives) is
 * **not** imported. {@link FocusOptions} mirrors the editable subset of
 * `FocusBehaviourOptions` structurally — keep it in sync by hand.
 */

/**
 * The subset of `FocusBehaviourOptions` this editor produces — a serialisable
 * patch. Base fields (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out
 * of scope.
 */
export interface FocusOptions {
  focusState?: string;
  dimState?: string;
  includeEdges?: boolean;
  frame?: boolean;
  framePadding?: number;
  frameDurationMs?: number;
  frameMaxZoom?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. 1:1 with
 * {@link FocusOptions} — no unions to split.
 */
export type FocusFields = FocusOptions;

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface FocusFormState {
  options: FocusFields;
}
