import type { EntranceFields, EntranceOptions } from './types';

/**
 * Map an `EntranceBehaviourOptions`-shaped patch to the flat
 * {@link EntranceFields} the `@invana/forms` generator renders. The engine's
 * options are already flat, so this is a straight projection of the editable
 * subset — the base fields (`id` / `targetLayerId` / `enabled`) are dropped.
 */
export function optionsToForm(o: EntranceOptions = {}): EntranceFields {
  return {
    durationMs: o.durationMs,
    staggerMs: o.staggerMs,
    maxStaggerMs: o.maxStaggerMs,
    order: o.order,
    includeEdges: o.includeEdges,
    easing: o.easing,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EntranceOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`.
 */
export function formToOptions(f: EntranceFields): EntranceOptions {
  const out: EntranceOptions = {};
  if (f.durationMs !== undefined) out.durationMs = f.durationMs;
  if (f.staggerMs !== undefined) out.staggerMs = f.staggerMs;
  if (f.maxStaggerMs !== undefined) out.maxStaggerMs = f.maxStaggerMs;
  if (f.order !== undefined) out.order = f.order;
  if (f.includeEdges !== undefined) out.includeEdges = f.includeEdges;
  if (f.easing !== undefined) out.easing = f.easing;
  return out;
}
