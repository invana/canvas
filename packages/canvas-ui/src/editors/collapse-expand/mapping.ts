import type { CollapseExpandFields, CollapseExpandOptions } from './types';

/**
 * Map a `CollapseExpandBehaviourOptions`-shaped patch to the flat
 * {@link CollapseExpandFields}. The behaviour has no tunable options, so this is
 * an empty passthrough kept for pattern symmetry.
 */
export function optionsToForm(_o: CollapseExpandOptions = {}): CollapseExpandFields {
  return {};
}

/**
 * Inverse of {@link optionsToForm}. The behaviour has no tunable options, so
 * this always returns an empty patch.
 */
export function formToOptions(_f: CollapseExpandFields): CollapseExpandOptions {
  return {};
}
