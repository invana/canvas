/**
 * Types for the CollapseExpandBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here.
 * `CollapseExpandBehaviourOptions` carries **only** the base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`), all of which are out of
 * scope for the state editor — so this behaviour has **no user-tunable
 * settings**. The editor is still shipped for symmetry (rule 12: every
 * behaviour gets an editor) and renders an empty field set; add fields here if
 * the behaviour ever gains serialisable options.
 */

/**
 * The serialisable subset of `CollapseExpandBehaviourOptions` this editor
 * produces. Intentionally **empty** — the behaviour exposes no tunable options
 * beyond the omitted base fields.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CollapseExpandOptions {}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Empty — mirrors
 * {@link CollapseExpandOptions}.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CollapseExpandFields {}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface CollapseExpandFormState {
  options: CollapseExpandFields;
}
