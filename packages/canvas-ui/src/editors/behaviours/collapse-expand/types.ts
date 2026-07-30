/**
 * Types for the CollapseExpandBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here.
 * Of `CollapseExpandBehaviourOptions`, `doubleClickToToggle` and
 * `centerOnToggle` are the tunable visualisation state — the base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope for the
 * state editor.
 */

/**
 * The serialisable subset of `CollapseExpandBehaviourOptions` this editor
 * produces.
 */
export interface CollapseExpandOptions {
  /**
   * Double-clicking a group frame toggles it, as well as its `+` / `−` button.
   * Engine default `true`.
   */
  readonly doubleClickToToggle?: boolean;
  /**
   * Pan the camera to centre a frame after it opens or closes. Engine default
   * `true`.
   */
  readonly centerOnToggle?: boolean;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Mirrors
 * {@link CollapseExpandOptions} 1:1 — there's no encoding difference to bridge.
 */
export interface CollapseExpandFields {
  doubleClickToToggle?: boolean;
  centerOnToggle?: boolean;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface CollapseExpandFormState {
  options: CollapseExpandFields;
}
