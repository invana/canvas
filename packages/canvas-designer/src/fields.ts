import type { FieldConfig } from '@invana/forms';

import { roleField } from '@invana/canvas-ui';
import type { ElementType } from './types';

/** Sentinel for "static text / no data binding" (Radix selects forbid `''`). */
export const NO_BIND = '__static__';

/** Card-level controls (name + size + background role). */
export const CARD_FIELDS: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Template name' },
  { name: 'width', type: 'number', label: 'Width', min: 40, step: 2 },
  { name: 'height', type: 'number', label: 'Height', min: 40, step: 2 },
  { name: 'cornerRadius', type: 'number', label: 'Corner radius', min: 0, step: 1 },
  roleField('bgRole', 'Background role'),
];

/** A `bind` select built from the host's data-field schema (+ a static option). */
function bindField(dataFields: { key: string; label: string }[]): FieldConfig {
  return {
    name: 'bind',
    type: 'select',
    label: 'Bind to field',
    options: [
      { value: NO_BIND, label: '(static text)' },
      ...dataFields.map((f) => ({ value: f.key, label: f.label })),
    ],
  };
}

/** Property controls for the selected element, by kind. */
export function elementFields(
  type: ElementType,
  dataFields: { key: string; label: string }[],
): FieldConfig[] {
  switch (type) {
    case 'text':
      return [
        bindField(dataFields),
        { name: 'text', type: 'text', label: 'Static text', description: 'Used when not bound' },
        { name: 'fontSize', type: 'number', label: 'Font size', min: 6, step: 1 },
        { name: 'fontWeight', type: 'number', label: 'Font weight', min: 100, max: 900, step: 100 },
        roleField('colorRole', 'Colour role'),
        { name: 'uppercase', type: 'boolean', label: 'Uppercase' },
        { name: 'maxWidth', type: 'number', label: 'Max width (0 = none)', min: 0, step: 4 },
      ];
    case 'rect':
      return [
        { name: 'width', type: 'number', label: 'Width', min: 1, step: 1 },
        { name: 'height', type: 'number', label: 'Height', min: 1, step: 1 },
        { name: 'cornerRadius', type: 'number', label: 'Corner radius', min: 0, step: 1 },
        roleField('fillRole', 'Fill role'),
      ];
    case 'circle':
      return [
        { name: 'radius', type: 'number', label: 'Radius', min: 1, step: 1 },
        roleField('fillRole', 'Fill role'),
      ];
    case 'line':
      return [
        { name: 'x2', type: 'number', label: 'End X', step: 1 },
        { name: 'y2', type: 'number', label: 'End Y', step: 1 },
        { name: 'strokeWidth', type: 'number', label: 'Thickness', min: 1, step: 1 },
        roleField('colorRole', 'Colour role'),
      ];
    case 'image':
      return [
        bindField(dataFields),
        { name: 'size', type: 'number', label: 'Size', min: 8, step: 2 },
        {
          name: 'shape',
          type: 'select',
          label: 'Shape',
          options: [
            { value: 'circle', label: 'Circle' },
            { value: 'rounded', label: 'Rounded' },
          ],
        },
      ];
    default:
      return [];
  }
}
