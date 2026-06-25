import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` schemas for the hover-preview-card editor. The scalar fields
 * map 1:1 to {@link CardScalarFields}; the row fields to {@link CardRowField}.
 * Adding a control = one `FieldConfig` here + the matching key in the form type
 * + a line in `mapping.ts` — no bespoke JSX.
 */

/** Image / title / subtitle controls (rendered under the `card` ObjectField). */
export const CARD_SCALAR_FIELDS: FieldConfig[] = [
  { name: 'titleField', type: 'text', label: 'Title field', description: 'Dotted path, e.g. data.name' },
  { name: 'subtitleField', type: 'text', label: 'Subtitle field', description: 'e.g. data.description' },
  { name: 'subtitleMaxLines', type: 'number', label: 'Subtitle max lines', min: 1, max: 5, step: 1 },
  { name: 'imageField', type: 'text', label: 'Avatar field', description: 'e.g. data.avatar (blank = no image)' },
  {
    name: 'imageShape',
    type: 'select',
    label: 'Avatar shape',
    options: [
      { value: 'rounded', label: 'Rounded' },
      { value: 'circle', label: 'Circle' },
    ],
  },
];

/** Per-row controls (rendered under each `rows.<i>` ObjectField). */
export const CARD_ROW_FIELDS: FieldConfig[] = [
  { name: 'label', type: 'text', label: 'Label' },
  { name: 'field', type: 'text', label: 'Field' },
  {
    name: 'format',
    type: 'select',
    label: 'Format',
    options: [
      { value: 'text', label: 'Text' },
      { value: 'percent', label: 'Percent' },
    ],
  },
];
