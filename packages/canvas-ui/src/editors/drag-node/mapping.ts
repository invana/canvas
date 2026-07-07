import type { DragNodeFields, DragNodeOptions } from './types';

/**
 * Map a `DragNodeBehaviourOptions`-shaped patch to the flat {@link DragNodeFields}
 * the `@invana/forms` generator renders. No colours, nested groups, or unions —
 * a straight passthrough.
 */
export function optionsToForm(o: DragNodeOptions = {}): DragNodeFields {
  return {
    dragCursor: o.dragCursor,
    groupAware: o.groupAware,
    pinOnRelease: o.pinOnRelease,
    dragSelection: o.dragSelection,
    selectionState: o.selectionState,
    selectionBodyDrag: o.selectionBodyDrag,
    selectionBodyPadding: o.selectionBodyPadding,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DragNodeOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
export function formToOptions(f: DragNodeFields): DragNodeOptions {
  const out: DragNodeOptions = {};
  if (f.dragCursor !== undefined) out.dragCursor = f.dragCursor;
  if (f.groupAware !== undefined) out.groupAware = f.groupAware;
  if (f.pinOnRelease !== undefined) out.pinOnRelease = f.pinOnRelease;
  if (f.dragSelection !== undefined) out.dragSelection = f.dragSelection;
  if (f.selectionState !== undefined) out.selectionState = f.selectionState;
  if (f.selectionBodyDrag !== undefined) out.selectionBodyDrag = f.selectionBodyDrag;
  if (f.selectionBodyPadding !== undefined) out.selectionBodyPadding = f.selectionBodyPadding;
  return out;
}
