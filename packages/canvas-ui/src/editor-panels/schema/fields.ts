import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../shared/colors';

/**
 * `@invana/forms` field schemas for {@link SchemaEditorPanel}. `meta` (title + header
 * colour) plus the per-field row (name + type select), used by a
 * `useFieldArray`. Field `name`s match {@link SchemaEditorFormState} 1:1.
 */

/** The built-in data-type vocabulary (matches the type-chip palette). */
export const SCHEMA_TYPES = ['string', 'integer', 'number', 'boolean', 'date'] as const;

/** `select` options for a field's data type. */
export const SCHEMA_TYPE_OPTIONS = SCHEMA_TYPES.map((t) => ({ value: t, label: t }));

/** Table title + header colour. */
export const SCHEMA_META_FIELDS: FieldConfig[] = [
  { name: 'label', type: 'text', label: 'Table name', placeholder: 'e.g. Dim_Customer' },
  { name: 'headerColor', type: 'color', label: 'Header colour', presetColors: [...COLOR_PRESETS] },
];

/** One field row: name + data-type select. */
export const SCHEMA_FIELD_ROW: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Field' },
  { name: 'type', type: 'select', label: 'Type', options: SCHEMA_TYPE_OPTIONS },
];
