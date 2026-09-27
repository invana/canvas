import { formToModes, modesToForm } from '../../_shared/modes';
import type { CreateNodeFields, CreateNodeOptions } from './types';

/**
 * Map a `CreateNodeBehaviourOptions`-shaped patch to the flat
 * {@link CreateNodeFields}. Only the base `modes` gate is serialisable.
 */
export function optionsToForm(o: CreateNodeOptions = {}): CreateNodeFields {
  return { modes: modesToForm(o.modes) };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link CreateNodeOptions} patch. An empty `modes` group clears the gate.
 */
export function formToOptions(f: CreateNodeFields): CreateNodeOptions {
  const out: CreateNodeOptions = {};
  const modes = formToModes(f.modes);
  if (modes !== undefined) out.modes = modes ?? undefined;
  return out;
}
