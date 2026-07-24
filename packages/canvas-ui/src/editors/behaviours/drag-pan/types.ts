/**
 * Types for the DragPanBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `DragPanBehaviour` and its
 * options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link DragPanOptions}, a plain serialisable patch the consumer applies via
 * `setOptions`. The mirror is structural, not derived, so it can't `Pick` from
 * the engine — keep it in sync with `DragPanBehaviourOptions` by hand.
 */

/**
 * The subset of `DragPanBehaviourOptions` this editor produces — a serialisable
 * patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts` fields are
 * out of scope; only the user-tunable scalars round-trip.
 */
export interface DragPanOptions {
  /** Which modifier key must be held during drag. */
  modifier?: 'none' | 'space' | 'shift' | 'alt';
  /** Allowed mouse buttons. */
  mouseButtons?: 'all' | 'left' | 'right' | 'middle';
  /** Add momentum deceleration after pointer lift. */
  decelerate?: boolean;
  /** Cursor applied to the canvas while the pan pointer is held. */
  dragCursor?: string;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. `DragPanOptions`
 * has no nesting or unions, so this mirrors it 1:1.
 */
export interface DragPanFields {
  modifier?: 'none' | 'space' | 'shift' | 'alt';
  mouseButtons?: 'all' | 'left' | 'right' | 'middle';
  decelerate?: boolean;
  dragCursor?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface DragPanFormState {
  options: DragPanFields;
}
