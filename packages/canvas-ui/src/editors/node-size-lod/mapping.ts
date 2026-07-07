import type { NodeSizeLODFields, NodeSizeLODOptions } from './types';

/**
 * Map a `NodeSizeLODBehaviourOptions`-shaped patch to the flat
 * {@link NodeSizeLODFields} the `@invana/forms` generator renders. Both fields
 * are numbers, so this is a straight pass-through. `layers[]` is dropped (not
 * modelled in the form).
 */
export function optionsToForm(o: NodeSizeLODOptions = {}): NodeSizeLODFields {
  return {
    scaleEpsilon: o.scaleEpsilon,
    settleMs: o.settleMs,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link NodeSizeLODOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions` — leaving `layers[]` untouched.
 */
export function formToOptions(f: NodeSizeLODFields): NodeSizeLODOptions {
  const out: NodeSizeLODOptions = {};
  if (f.scaleEpsilon !== undefined) out.scaleEpsilon = f.scaleEpsilon;
  if (f.settleMs !== undefined) out.settleMs = f.settleMs;
  return out;
}
