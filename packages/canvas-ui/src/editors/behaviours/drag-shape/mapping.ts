import type { DragShapeFields, DragShapeOptions } from './types';

/**
 * Map a `DragShapeBehaviourOptions`-shaped patch to the flat
 * {@link DragShapeFields} the `@invana/forms` generator renders. A 1:1 copy —
 * the `renderer` / `filter` options are not editable here.
 */
export function optionsToForm(o: DragShapeOptions = {}): DragShapeFields {
  return {
    reRouteConnectors: o.reRouteConnectors,
    dragCursor: o.dragCursor,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DragShapeOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
export function formToOptions(f: DragShapeFields): DragShapeOptions {
  const out: DragShapeOptions = {};
  if (f.reRouteConnectors !== undefined) out.reRouteConnectors = f.reRouteConnectors;
  if (f.dragCursor !== undefined) out.dragCursor = f.dragCursor;
  return out;
}
