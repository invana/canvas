import type { ParallelEdgeFields, ParallelEdgeOptions } from './types';

/**
 * Map a `ParallelEdgeBehaviourOptions`-shaped patch to the flat
 * {@link ParallelEdgeFields} the `@invana/forms` generator renders. All fields
 * are scalar / enum / boolean, so this is a straight pass-through.
 */
export function optionsToForm(o: ParallelEdgeOptions = {}): ParallelEdgeFields {
  return {
    spacing: o.spacing,
    basis: o.basis,
    anchorOffset: o.anchorOffset,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ParallelEdgeOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * behaviour's current options on `setOptions`.
 */
export function formToOptions(f: ParallelEdgeFields): ParallelEdgeOptions {
  const out: ParallelEdgeOptions = {};
  if (f.spacing !== undefined) out.spacing = f.spacing;
  if (f.basis !== undefined) out.basis = f.basis;
  if (f.anchorOffset !== undefined) out.anchorOffset = f.anchorOffset;
  return out;
}
