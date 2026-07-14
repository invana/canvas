import type { TextResolutionLODFields, TextResolutionLODOptions } from './types';

/**
 * Map a `TextResolutionLODBehaviourOptions`-shaped patch to the flat
 * {@link TextResolutionLODFields} the `@invana/forms` generator renders. Both
 * fields are numbers, so this is a straight pass-through. `levels[]` is dropped
 * (not modelled in the form).
 */
export function optionsToForm(o: TextResolutionLODOptions = {}): TextResolutionLODFields {
  return {
    baseResolution: o.baseResolution,
    hysteresis: o.hysteresis,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link TextResolutionLODOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions` — leaving `levels[]` untouched.
 */
export function formToOptions(f: TextResolutionLODFields): TextResolutionLODOptions {
  const out: TextResolutionLODOptions = {};
  if (f.baseResolution !== undefined) out.baseResolution = f.baseResolution;
  if (f.hysteresis !== undefined) out.hysteresis = f.hysteresis;
  return out;
}
