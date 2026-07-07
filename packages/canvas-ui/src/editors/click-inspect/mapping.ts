import type { ClickInspectFields, ClickInspectOptions } from './types';

/**
 * Map a `ClickInspectBehaviourOptions`-shaped patch to the flat
 * {@link ClickInspectFields} the `@invana/forms` generator renders.
 */
export function optionsToForm(o: ClickInspectOptions = {}): ClickInspectFields {
  return {
    clearOnBackground: o.clearOnBackground,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ClickInspectOptions} patch. Only fields the form set are included, so
 * the result is safe to spread over the behaviour's current options on
 * `setOptions`.
 */
export function formToOptions(f: ClickInspectFields): ClickInspectOptions {
  const out: ClickInspectOptions = {};
  if (f.clearOnBackground !== undefined) out.clearOnBackground = f.clearOnBackground;
  return out;
}
