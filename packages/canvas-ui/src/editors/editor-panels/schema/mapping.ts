import { hexToNumber, numberToHex } from '../../../shared/color';
import type { NodeSchema, SchemaEditorFormState } from './types';

/** Seed the form from a {@link NodeSchema} (use as `defaults`). */
export function schemaToForm(schema?: NodeSchema): SchemaEditorFormState {
  return {
    meta: {
      label: schema?.label ?? '',
      headerColor: typeof schema?.headerColor === 'number' ? numberToHex(schema.headerColor) : undefined,
    },
    // Copy each row so edits don't mutate the caller's array; spread preserves
    // any extra keys from custom row controls.
    fields: (schema?.fields ?? []).map((f) => ({ ...f })),
  };
}

/** Read the form back into a {@link NodeSchema} (drops nameless rows). */
export function formToSchema(values: SchemaEditorFormState): NodeSchema {
  const headerHex = values.meta.headerColor;
  return {
    label: (values.meta.label ?? '').trim(),
    ...(headerHex && headerHex.length > 0 ? { headerColor: hexToNumber(headerHex) } : {}),
    fields: (values.fields ?? [])
      // Spread keeps extra keys (`nullable`, `description`, …) from overridden
      // `fieldRowFields`; name/type are normalised on top.
      .map((f) => ({ ...f, name: (f.name ?? '').trim(), type: f.type || 'string' }))
      .filter((f) => f.name.length > 0),
  };
}
