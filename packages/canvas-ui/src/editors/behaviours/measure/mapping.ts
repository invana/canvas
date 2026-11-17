import type { MeasureFields, MeasureOptions } from './types';

export function optionsToForm(o: MeasureOptions = {}): MeasureFields {
  return { tool: o.tool === undefined ? undefined : (o.tool ?? 'none') };
}

/** `none` becomes `null`. */
export function formToOptions(f: MeasureFields): MeasureOptions {
  return f.tool === undefined ? {} : { tool: f.tool === 'none' ? null : f.tool };
}
