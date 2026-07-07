/**
 * Types for the ClickInspectBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ClickInspectBehaviour`
 * lives) is **not** imported. {@link ClickInspectOptions} mirrors the editable
 * subset of `ClickInspectBehaviourOptions` structurally — keep it in sync by
 * hand.
 */

/**
 * The subset of `ClickInspectBehaviourOptions` this editor produces — a
 * serialisable patch. Base fields (`id` / `targetLayerId` / `enabled` /
 * `shortcuts`) are out of scope; only the user-tunable `clearOnBackground`
 * round-trips.
 */
export interface ClickInspectOptions {
  clearOnBackground?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. 1:1 with
 * {@link ClickInspectOptions} — no unions to split.
 */
export interface ClickInspectFields {
  clearOnBackground?: boolean;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ClickInspectFormState {
  options: ClickInspectFields;
}
