import type { PinchZoomFields, PinchZoomOptions } from './types';

/**
 * Map a `PinchZoomBehaviourOptions`-shaped patch to the flat
 * {@link PinchZoomFields} the `@invana/forms` generator renders. A 1:1 copy —
 * no unions or nesting.
 */
export function optionsToForm(o: PinchZoomOptions = {}): PinchZoomFields {
  return {
    noDrag: o.noDrag,
    percent: o.percent,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link PinchZoomOptions} patch. Only fields the form actually set are included
 * (no `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
export function formToOptions(f: PinchZoomFields): PinchZoomOptions {
  const out: PinchZoomOptions = {};
  if (f.noDrag !== undefined) out.noDrag = f.noDrag;
  if (f.percent !== undefined) out.percent = f.percent;
  return out;
}
