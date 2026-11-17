import type { DrawGeoFeatureFields, DrawGeoFeatureOptions } from './types';

export function optionsToForm(o: DrawGeoFeatureOptions = {}): DrawGeoFeatureFields {
  return { tool: o.tool === undefined ? undefined : (o.tool ?? 'none'), author: o.author, idPrefix: o.idPrefix };
}

/** Only fields the form set are included; `none` becomes `null`, an empty author is dropped. */
export function formToOptions(f: DrawGeoFeatureFields): DrawGeoFeatureOptions {
  const out: DrawGeoFeatureOptions = {};
  if (f.tool !== undefined) out.tool = f.tool === 'none' ? null : f.tool;
  if (f.author) out.author = f.author;
  if (f.idPrefix) out.idPrefix = f.idPrefix;
  return out;
}
