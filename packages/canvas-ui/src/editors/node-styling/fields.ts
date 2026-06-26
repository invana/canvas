import type { FieldConfig } from '@invana/forms';

import { roleField } from '../field-helpers';

/**
 * `@invana/forms` schemas for {@link NodeStylingEditor}. Scalars map 1:1 to
 * {@link NodeStylingScalarFields}; the slot rows to {@link SlotStylingRow}.
 */

/** Scalar styling controls (rendered under the `styling` ObjectField). */
export const STYLING_SCALAR_FIELDS: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Name', group: 'General' },
  roleField('fillRole', 'Fill role'),
  roleField('strokeRole', 'Stroke role'),
  { name: 'strokeWidth', type: 'number', label: 'Stroke width', min: 0, step: 0.5 },
  roleField('bgRole', 'Card bg role'),
  roleField('accentRole', 'Accent role'),
  roleField('labelColorRole', 'Label colour role'),
  { name: 'labelFontSize', type: 'number', label: 'Label font size', min: 1, step: 1 },
  {
    name: 'labelPlacement',
    type: 'select',
    label: 'Label placement',
    options: [
      { value: 'bottom', label: 'Bottom' },
      { value: 'center', label: 'Center' },
      { value: 'top', label: 'Top' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ],
  },
];

/** Per-slot styling controls (rendered under each `slots.<i>` ObjectField). */
export const SLOT_STYLING_FIELDS: FieldConfig[] = [
  { name: 'slot', type: 'text', label: 'Slot' },
  roleField('colorRole', 'Colour role'),
  { name: 'fontSize', type: 'number', label: 'Font size', min: 1, step: 1 },
  { name: 'fontWeight', type: 'number', label: 'Font weight', min: 100, max: 900, step: 100 },
  { name: 'uppercase', type: 'boolean', label: 'Uppercase' },
];
