import { formToModes, modesToForm } from '../../_shared/modes';
import type { EraseFields, EraseOptions } from './types';

/**
 * Map an `EraseBehaviourOptions`-shaped patch to the flat {@link EraseFields}
 * the `@invana/forms` generator renders. A direct pass-through of the `target`
 * enum, plus the `modes` gate as a checkbox group.
 */
export function optionsToForm(o: EraseOptions = {}): EraseFields {
  return {
    target: o.target,
    modes: modesToForm(o.modes),
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
  const modes = formToModes(f.modes);
  if (modes !== undefined) out.modes = modes ?? undefined;
  return out;
}
