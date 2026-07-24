/**
 * Types for the ClickViewBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ClickViewBehaviour` lives)
 * is **not** imported. {@link ClickViewOptions} mirrors the editable subset of
 * `ClickViewBehaviourOptions` structurally — keep it in sync by hand.
 */

/**
 * The subset of `ClickViewBehaviourOptions` this editor produces — a
 * serialisable patch. Base fields (`id` / `targetLayerId` / `enabled` /
 * `shortcuts`) are out of scope; only the user-tunable `clearOnBackground`
 * round-trips.
 */
export interface ClickViewOptions {
  clearOnBackground?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. 1:1 with
 * {@link ClickViewOptions} — no unions to split.
 */
export interface ClickViewFields {
  clearOnBackground?: boolean;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ClickViewFormState {
  options: ClickViewFields;
}
