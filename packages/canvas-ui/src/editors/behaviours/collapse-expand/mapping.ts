import type { CollapseExpandFields, CollapseExpandOptions } from './types';

/**
 * Map a `CollapseExpandBehaviourOptions`-shaped patch to the flat
 * {@link CollapseExpandFields}. Both options are plain booleans, so this is a
 * straight copy — each falls back to the engine's `true` default so an unset
 * option still renders its checkbox in the effective state.
 */
export function optionsToForm(o: CollapseExpandOptions = {}): CollapseExpandFields {
  return {
    doubleClickToToggle: o.doubleClickToToggle ?? true,
    centerOnToggle: o.centerOnToggle ?? true,
  };
}

/** Inverse of {@link optionsToForm}. */
export function formToOptions(f: CollapseExpandFields): CollapseExpandOptions {
  return {
    doubleClickToToggle: f.doubleClickToToggle ?? true,
    centerOnToggle: f.centerOnToggle ?? true,
  };
}
