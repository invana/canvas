import type { EraseFields, EraseOptions } from './types';

/**
 * Map an `EraseBehaviourOptions`-shaped patch to the flat {@link EraseFields}
 * the `@invana/forms` generator renders. A direct pass-through — the only
 * option is the `target` enum.
 */
export function optionsToForm(o: EraseOptions = {}): EraseFields {
  return {
    target: o.target,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EraseOptions} patch. Only fields the form actually set are included, so
 * the result is safe to spread on `setOptions`.
 */
export function formToOptions(f: EraseFields): EraseOptions {
  const out: EraseOptions = {};
  if (f.target !== undefined) out.target = f.target;
  return out;
}
