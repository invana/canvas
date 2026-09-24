import type { CollapseExpandFields, CollapseExpandOptions } from './types';

/** The engine's `centerDurationMs` default — mirrored, as the editor is engine-agnostic. */
const DEFAULT_CENTER_DURATION_MS = 300;

/** The engine's `countBadgePlacement` default — mirrored, as above. */
const DEFAULT_COUNT_BADGE_PLACEMENT = 'top-right';

/**
 * Map a `CollapseExpandBehaviourOptions`-shaped patch to the flat
 * {@link CollapseExpandFields}. The options are plain values, so this is a
 * straight copy — each falls back to the engine's default so an unset option
 * still renders in its effective state.
 */
export function optionsToForm(o: CollapseExpandOptions = {}): CollapseExpandFields {
  return {
    doubleClickToToggle: o.doubleClickToToggle ?? true,
    centerOnToggle: o.centerOnToggle ?? false,
    centerDurationMs: o.centerDurationMs ?? DEFAULT_CENTER_DURATION_MS,
    relayoutOnToggle: o.relayoutOnToggle ?? false,
    countBadge: o.countBadge ?? false,
    countBadgePlacement: o.countBadgePlacement ?? DEFAULT_COUNT_BADGE_PLACEMENT,
  };
}

/** Inverse of {@link optionsToForm}. */
export function formToOptions(f: CollapseExpandFields): CollapseExpandOptions {
  return {
    doubleClickToToggle: f.doubleClickToToggle ?? true,
    centerOnToggle: f.centerOnToggle ?? false,
    centerDurationMs: f.centerDurationMs ?? DEFAULT_CENTER_DURATION_MS,
    relayoutOnToggle: f.relayoutOnToggle ?? false,
    countBadge: f.countBadge ?? false,
    countBadgePlacement: f.countBadgePlacement ?? DEFAULT_COUNT_BADGE_PLACEMENT,
  };
}
