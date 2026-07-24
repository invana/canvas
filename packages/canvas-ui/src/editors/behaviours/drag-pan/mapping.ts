import type { DragPanFields, DragPanOptions } from './types';

/**
 * Map a `DragPanBehaviourOptions`-shaped patch to the flat {@link DragPanFields}
 * the `@invana/forms` generator renders. A 1:1 copy — no unions or nesting.
 */
export function optionsToForm(o: DragPanOptions = {}): DragPanFields {
  return {
    modifier: o.modifier,
    mouseButtons: o.mouseButtons,
    decelerate: o.decelerate,
    dragCursor: o.dragCursor,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DragPanOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
export function formToOptions(f: DragPanFields): DragPanOptions {
  const out: DragPanOptions = {};
  if (f.modifier !== undefined) out.modifier = f.modifier;
  if (f.mouseButtons !== undefined) out.mouseButtons = f.mouseButtons;
  if (f.decelerate !== undefined) out.decelerate = f.decelerate;
  if (f.dragCursor !== undefined) out.dragCursor = f.dragCursor;
  return out;
}
