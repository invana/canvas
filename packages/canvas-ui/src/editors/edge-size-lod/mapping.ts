import type { EdgeSizeLODFields, EdgeSizeLODOptions } from './types';

/**
 * Map an `EdgeSizeLODBehaviourOptions`-shaped patch to the flat
 * {@link EdgeSizeLODFields} the `@invana/forms` generator renders. Both fields
 * are numbers, so this is a straight pass-through. `layers[]` is dropped (not
 * modelled in the form).
 */
export function optionsToForm(o: EdgeSizeLODOptions = {}): EdgeSizeLODFields {
  return {
    scaleEpsilon: o.scaleEpsilon,
    settleMs: o.settleMs,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EdgeSizeLODOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions` — leaving `layers[]` untouched.
 */
export function formToOptions(f: EdgeSizeLODFields): EdgeSizeLODOptions {
  const out: EdgeSizeLODOptions = {};
  if (f.scaleEpsilon !== undefined) out.scaleEpsilon = f.scaleEpsilon;
  if (f.settleMs !== undefined) out.settleMs = f.settleMs;
  return out;
}
