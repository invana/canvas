import type { CreateNodeFields, CreateNodeOptions } from './types';

/**
 * Map a `CreateNodeBehaviourOptions`-shaped patch to the flat
 * {@link CreateNodeFields}. A no-op: `CreateNodeBehaviour` has no serialisable
 * scalar options (only callbacks + host-owned base fields).
 */
export function optionsToForm(_o: CreateNodeOptions = {}): CreateNodeFields {
  return {};
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link CreateNodeOptions} patch. A no-op — the behaviour has no serialisable
 * scalars to round-trip.
 */
export function formToOptions(_f: CreateNodeFields): CreateNodeOptions {
  return {};
}
