/**
 * Types for the CreateNodeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `CreateNodeBehaviour` and
 * its options live) is **not** imported for values — canvas-ui mirrors the
 * editable option shape here as {@link CreateNodeOptions}, a plain serialisable
 * patch the consumer applies via `setOptions`. The mirror is structural, not
 * derived; keep it in sync with `CreateNodeBehaviourOptions` by hand.
 */

/**
 * The serialisable subset of `CreateNodeBehaviourOptions` this editor produces.
 *
 * `CreateNodeBehaviour` exposes no user-tunable scalars: its only options are
 * the `createNode` / `onNodeCreate` **callbacks** (out of scope — not
 * serialisable) plus the base `targetLayerId` / `enabled` / `shortcuts` (owned
 * by the host). So this patch is empty. The editor exists for parity (root
 * `CLAUDE.md` rule 12 — every behaviour ships an editor) and as the seam where a
 * future scalar option (e.g. a default node `type`) would land.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateNodeOptions {}

/** Flat form-field shape — empty, mirroring {@link CreateNodeOptions}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateNodeFields {}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface CreateNodeFormState {
  options: CreateNodeFields;
}
