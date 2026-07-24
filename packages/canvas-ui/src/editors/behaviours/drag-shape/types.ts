/**
 * Types for the DragShapeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `DragShapeBehaviour` and
 * its options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link DragShapeOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. The mirror is structural, not derived, so it can't `Pick`
 * from the engine — keep it in sync with `DragShapeBehaviourOptions` by hand.
 */

/**
 * The subset of `DragShapeBehaviourOptions` this editor produces — a
 * serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
 * fields are out of scope, and the non-serialisable `renderer` handle + `filter`
 * predicate are omitted; only the tunable scalars round-trip.
 */
export interface DragShapeOptions {
  /** Re-route every connector after each move (obstacle-aware routers). */
  reRouteConnectors?: boolean;
  /** Cursor applied while a shape is being dragged. */
  dragCursor?: string;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders.
 * `DragShapeOptions` has no nesting or unions, so this mirrors it 1:1.
 */
export interface DragShapeFields {
  reRouteConnectors?: boolean;
  dragCursor?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface DragShapeFormState {
  options: DragShapeFields;
}
