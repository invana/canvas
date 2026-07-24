import type { ContentLODFields, ContentLODOptions } from './types';

/**
 * Map a content-LOD options patch to the flat {@link ContentLODFields} the
 * `@invana/forms` generator renders. Both are `{ minZoom, maxZoom }` — a
 * straight pass-through.
 */
export function optionsToForm(o: ContentLODOptions = {}): ContentLODFields {
  return { minZoom: o.minZoom, maxZoom: o.maxZoom, alwaysShowTop: o.alwaysShowTop };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ContentLODOptions} patch, omitting blank bounds so the result is safe
 * to spread over the behaviour's current options on `setOptions`.
 */
export function formToOptions(f: ContentLODFields): ContentLODOptions {
  const out: ContentLODOptions = {};
  if (f.minZoom !== undefined) out.minZoom = f.minZoom;
  if (f.maxZoom !== undefined) out.maxZoom = f.maxZoom;
  if (f.alwaysShowTop !== undefined) out.alwaysShowTop = f.alwaysShowTop;
  return out;
}
