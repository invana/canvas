import type { EdgeLODFields, EdgeLODOptions } from './types';

/**
 * Map an `EdgeLODBehaviourOptions`-shaped patch to the flat {@link EdgeLODFields}
 * the `@invana/forms` generator renders — a straight pass-through.
 */
export function optionsToForm(o: EdgeLODOptions = {}): EdgeLODFields {
  return {
    minZoom: o.minZoom,
    keepFraction: o.keepFraction,
    keepBy: o.keepBy,
    weightKey: o.weightKey,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link EdgeLODOptions} patch, omitting unset keys so it's safe to spread over
 * the behaviour's current options on `setOptions`.
 */
export function formToOptions(f: EdgeLODFields): EdgeLODOptions {
  const out: EdgeLODOptions = {};
  if (f.minZoom !== undefined) out.minZoom = f.minZoom;
  if (f.keepFraction !== undefined) out.keepFraction = f.keepFraction;
  if (f.keepBy !== undefined) out.keepBy = f.keepBy;
  if (f.weightKey !== undefined) out.weightKey = f.weightKey;
  return out;
}
