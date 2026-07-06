import type { FieldConfig } from '@invana/forms';

import type { GeometricLayoutFields } from './types';

/**
 * `@invana/forms` field schema for the GeometricLayout editor, grouped into
 * accordion sections. Field `name`s match {@link GeometricLayoutFields} 1:1.
 *
 * A function of the live values: the per-mode numerics (grid gaps vs circular
 * radius/angle) swap with the watched `mode` — the form-generator's way of
 * handling the mode-specific option groups.
 */

const MODE_FIELD: FieldConfig = {
  name: 'mode',
  type: 'select',
  label: 'Mode',
  options: [
    { value: 'grid', label: 'Grid' },
    { value: 'snake', label: 'Snake' },
    { value: 'circular', label: 'Circular' },
  ],
};

const GRID_FIELDS: FieldConfig[] = [
  { name: 'columns', type: 'number', label: 'Columns', min: 1, max: 200, step: 1, description: 'Default ⌈√n⌉ (a square-ish block).' },
  { name: 'columnGap', type: 'number', label: 'Column gap', min: 0, max: 500, step: 1 },
  { name: 'rowGap', type: 'number', label: 'Row gap', min: 0, max: 500, step: 1 },
];

const CIRCULAR_FIELDS: FieldConfig[] = [
  { name: 'radius', type: 'number', label: 'Radius', min: 0, max: 5000, step: 10, description: 'Default: auto from node count + spacing.' },
  { name: 'nodeSpacing', type: 'number', label: 'Node spacing', min: 1, max: 500, step: 1, description: 'Arc spacing used to auto-derive radius.' },
  { name: 'startAngle', type: 'number', label: 'Start angle', min: -6.2832, max: 6.2832, step: 0.0873, description: 'First node angle, in radians. Default -π/2 (12 o’clock).' },
  { name: 'clockwise', type: 'boolean', label: 'Clockwise' },
];

const POSITION_FIELDS: FieldConfig[] = [
  { name: 'centerX', type: 'number', label: 'Center X', min: -10000, max: 10000, step: 10 },
  { name: 'centerY', type: 'number', label: 'Center Y', min: -10000, max: 10000, step: 10 },
];

const TRANSITION_FIELDS: FieldConfig[] = [
  { name: 'transition', type: 'boolean', label: 'Animate', description: 'Glide nodes to their new positions instead of snapping.' },
  { name: 'transitionEase', type: 'text', label: 'Ease', placeholder: 'e.g. cubic-in-out' },
];

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

/**
 * Per-mode geometry fields for the current mode. Dynamic: grid/snake show the
 * column + gap numerics, circular shows radius/spacing/angle.
 */
export function modeFields(mode: GeometricLayoutFields['mode']): FieldConfig[] {
  const perMode = mode === 'circular' ? CIRCULAR_FIELDS : GRID_FIELDS;
  return [MODE_FIELD, ...perMode];
}

/**
 * The full GeometricLayout field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<GeometricLayoutEditor>`. Layout numerics vary with the
 * current `mode`.
 */
export function geometricLayoutFields(values: GeometricLayoutFields = {}): FieldConfig[] {
  return [
    ...modeFields(values.mode).map(withGroup('Layout')),
    ...POSITION_FIELDS.map(withGroup('Position')),
    ...TRANSITION_FIELDS.map(withGroup('Transition')),
  ];
}
