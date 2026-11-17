import type { AreaQueryFields, AreaQueryOptions } from './types';

export function optionsToForm(o: AreaQueryOptions = {}): AreaQueryFields {
  return { autoQuery: o.autoQuery, withinKm: o.withinKm };
}

/** Only fields the form set are included. */
export function formToOptions(f: AreaQueryFields): AreaQueryOptions {
  const out: AreaQueryOptions = {};
  if (f.autoQuery !== undefined) out.autoQuery = f.autoQuery;
  if (f.withinKm !== undefined) out.withinKm = f.withinKm;
  return out;
}
