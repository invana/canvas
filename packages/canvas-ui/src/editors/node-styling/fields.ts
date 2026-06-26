import type { FieldConfig } from '@invana/forms';

import { roleField } from '../field-helpers';

/**
 * `@invana/forms` schemas for {@link NodeStylingEditor}. Scalars map 1:1 to
 * {@link NodeStylingScalarFields}; the slot rows to {@link SlotStylingRow}.
 *
 * The relevant controls differ by structure kind, so the editor's `variant`
 * picks the matching subset — showing fields that *don't* apply (e.g. `fillRole`
 * on a card, which the compiler ignores) is what makes edits look like no-ops:
 * - **simple** shapes use fill / stroke / label → {@link SIMPLE_STYLING_FIELDS}
 * - **card** structures use bg / accent + per-slot styling → {@link CARD_STYLING_FIELDS}
 */

const NAME_FIELD: FieldConfig = { name: 'name', type: 'text', label: 'Name' };

const LABEL_PLACEMENT_FIELD: FieldConfig = {
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
};

/** Controls for a **simple** shape (the compiler's `compileSimple` inputs). */
export const SIMPLE_STYLING_FIELDS: FieldConfig[] = [
  NAME_FIELD,
  roleField('fillRole', 'Fill role'),
  roleField('strokeRole', 'Stroke role'),
  { name: 'strokeWidth', type: 'number', label: 'Stroke width', min: 0, step: 0.5 },
  roleField('labelColorRole', 'Label colour role'),
  { name: 'labelFontSize', type: 'number', label: 'Label font size', min: 1, step: 1 },
  LABEL_PLACEMENT_FIELD,
];

/** Controls for a **card** structure (the compiler's `compileCard` inputs). */
export const CARD_STYLING_FIELDS: FieldConfig[] = [
  NAME_FIELD,
  roleField('bgRole', 'Card background role'),
  roleField('accentRole', 'Accent role'),
];

/** All scalar controls — the default when no `variant` is given (standalone). */
export const STYLING_SCALAR_FIELDS: FieldConfig[] = [
  NAME_FIELD,
  roleField('fillRole', 'Fill role'),
  roleField('strokeRole', 'Stroke role'),
  { name: 'strokeWidth', type: 'number', label: 'Stroke width', min: 0, step: 0.5 },
  roleField('bgRole', 'Card background role'),
  roleField('accentRole', 'Accent role'),
  roleField('labelColorRole', 'Label colour role'),
  { name: 'labelFontSize', type: 'number', label: 'Label font size', min: 1, step: 1 },
  LABEL_PLACEMENT_FIELD,
];

/** Per-slot styling controls (rendered under each `slots.<i>` ObjectField). */
export const SLOT_STYLING_FIELDS: FieldConfig[] = [
  { name: 'slot', type: 'text', label: 'Slot' },
  roleField('colorRole', 'Colour role'),
  { name: 'fontSize', type: 'number', label: 'Font size', min: 1, step: 1 },
  { name: 'fontWeight', type: 'number', label: 'Font weight', min: 100, max: 900, step: 100 },
  { name: 'uppercase', type: 'boolean', label: 'Uppercase' },
];
