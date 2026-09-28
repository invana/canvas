import type { FocusFields, FocusOptions } from './types';

/** The keys the editor round-trips — {@link FocusOptions} and {@link FocusFields} share them. */
const KEYS = [
  'focusState',
  'dimState',
  'includeEdges',
  'frame',
  'framePadding',
  'frameDurationMs',
  'frameMaxZoom',
] as const satisfies ReadonlyArray<keyof FocusOptions>;

/**
 * Map a `FocusBehaviourOptions`-shaped patch to the flat {@link FocusFields}
 * the `@invana/forms` generator renders.
 */
export function optionsToForm(o: FocusOptions = {}): FocusFields {
  const out: FocusFields = {};
  for (const key of KEYS) (out as Record<string, unknown>)[key] = o[key];
  return out;
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link FocusOptions} patch. Only fields the form set are included, so the
 * result is safe to spread over the behaviour's current options on `setOptions`.
 * A blank `dimState` is kept (it means "never dim"); a blank `focusState` is
 * dropped (a focus always needs a state).
 */
export function formToOptions(f: FocusFields): FocusOptions {
  const out: FocusOptions = {};
  for (const key of KEYS) {
    const value = f[key];
    if (value === undefined || value === null) continue;
    if (key === 'focusState' && value === '') continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}
