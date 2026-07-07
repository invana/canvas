import type { ThemeFields, ThemeOptions } from './types';

/**
 * Map a `ThemeBehaviourOptions`-shaped patch to the flat {@link ThemeFields} the
 * `@invana/forms` generator renders. A direct pass-through — every field is a
 * scalar with no encoding to bridge (no colours: `accentVar` is a CSS-variable
 * name, not a colour value).
 */
export function optionsToForm(o: ThemeOptions = {}): ThemeFields {
  return {
    mode: o.mode,
    active: o.active,
    fallback: o.fallback,
    accentVar: o.accentVar,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ThemeOptions} patch. Only fields the form actually set are included, so
 * the result is safe to spread on `setOptions`.
 */
export function formToOptions(f: ThemeFields): ThemeOptions {
  const out: ThemeOptions = {};
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.active !== undefined) out.active = f.active;
  if (f.fallback !== undefined) out.fallback = f.fallback;
  if (f.accentVar !== undefined) out.accentVar = f.accentVar;
  return out;
}
