/**
 * Types for the DragNodeBehaviour editor.
 *
 * Engine-agnostic: the editable option shape is mirrored **structurally** here
 * as {@link DragNodeOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The `filter` predicate and the base `id` / `targetLayerId` /
 * `enabled` / `shortcuts` fields are out of scope — only the tunable scalars /
 * booleans round-trip.
 */

/**
 * The serialisable subset of `DragNodeBehaviourOptions` this editor produces.
 * `filter` (a function) is omitted.
 */
export interface DragNodeOptions {
  dragCursor?: string;
  groupAware?: boolean;
  pinOnRelease?: boolean;
  dragSelection?: boolean;
  selectionState?: string;
  selectionBodyDrag?: boolean;
  selectionBodyPadding?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Maps 1:1 to
 * {@link DragNodeOptions} — no nested groups or unions.
 */
export interface DragNodeFields {
  dragCursor?: string;
  groupAware?: boolean;
  pinOnRelease?: boolean;
  dragSelection?: boolean;
  selectionState?: string;
  selectionBodyDrag?: boolean;
  selectionBodyPadding?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface DragNodeFormState {
  options: DragNodeFields;
}
