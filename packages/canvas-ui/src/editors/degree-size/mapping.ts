import type { DegreeSizeFields, DegreeSizeOptions } from './types';

/**
 * Map a `DegreeSizeBehaviourOptions`-shaped patch to the flat
 * {@link DegreeSizeFields} the `@invana/forms` generator renders. All fields
 * are scalar / enum, so this is a straight pass-through.
 */
export function optionsToForm(o: DegreeSizeOptions = {}): DegreeSizeFields {
  return {
    direction: o.direction,
    minSize: o.minSize,
    maxSize: o.maxSize,
    scale: o.scale,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link DegreeSizeOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
export function formToOptions(f: DegreeSizeFields): DegreeSizeOptions {
  const out: DegreeSizeOptions = {};
  if (f.direction !== undefined) out.direction = f.direction;
  if (f.minSize !== undefined) out.minSize = f.minSize;
  if (f.maxSize !== undefined) out.maxSize = f.maxSize;
  if (f.scale !== undefined) out.scale = f.scale;
  return out;
}
