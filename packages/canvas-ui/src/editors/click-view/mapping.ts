import type { ClickViewFields, ClickViewOptions } from './types';

/**
 * Map a `ClickViewBehaviourOptions`-shaped patch to the flat
 * {@link ClickViewFields} the `@invana/forms` generator renders.
 */
export function optionsToForm(o: ClickViewOptions = {}): ClickViewFields {
  return {
    clearOnBackground: o.clearOnBackground,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ClickViewOptions} patch. Only fields the form set are included, so the
 * result is safe to spread over the behaviour's current options on `setOptions`.
 */
export function formToOptions(f: ClickViewFields): ClickViewOptions {
  const out: ClickViewOptions = {};
  if (f.clearOnBackground !== undefined) out.clearOnBackground = f.clearOnBackground;
  return out;
}
