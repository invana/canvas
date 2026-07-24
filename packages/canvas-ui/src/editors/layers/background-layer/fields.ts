import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';
import type { BackgroundLayerFields } from './types';

/**
 * `@invana/forms` field schema for the BackgroundLayer editor, grouped into
 * accordion sections. Field `name`s match {@link BackgroundLayerFields} 1:1.
 *
 * A function of the live values: the Pattern section only appears when
 * `type === 'pattern'`, since dot/line/grid controls are meaningless for a
 * solid fill.
 */

const FILL_FIELDS: FieldConfig[] = [
  {
    name: 'type',
    type: 'select',
    label: 'Type',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'pattern', label: 'Pattern' },
    ],
  },
  {
    name: 'backgroundColor',
    type: 'color',
    label: 'Background color',
    presetColors: [...COLOR_PRESETS],
    description: 'Solid backdrop painted behind the pattern.',
  },
  {
    name: 'mode',
    type: 'select',
    label: 'Theme mode',
    description: 'How light/dark colour variants resolve.',
    options: [
      { value: 'auto', label: 'Auto (follow theme)' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
  },
];

const PATTERN_FIELDS: FieldConfig[] = [
  {
    name: 'patternType',
    type: 'select',
    label: 'Pattern',
    options: [
      { value: 'dots', label: 'Dots' },
      { value: 'grid', label: 'Grid' },
      { value: 'lines', label: 'Lines' },
    ],
  },
  {
    name: 'color',
    type: 'color',
    label: 'Pattern color',
    presetColors: [...COLOR_PRESETS],
    description: 'Dot / line / grid colour.',
  },
  { name: 'size', type: 'number', label: 'Size', min: 0, max: 20, step: 0.5, description: 'Dot radius / line thickness, in texture pixels.' },
  { name: 'spacing', type: 'number', label: 'Spacing', min: 1, max: 100, step: 1, description: 'Tile cell spacing, in texture pixels.' },
  { name: 'alpha', type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 },
  {
    name: 'followCamera',
    type: 'boolean',
    label: 'Follow camera',
    description: 'Pattern shifts + scales with the camera when on.',
  },
];

const THEME_FIELDS: FieldConfig[] = [
  { name: 'surfaceRole', type: 'text', label: 'Surface role', description: 'Palette role read for the backdrop on theme change. Default "surface".' },
  { name: 'patternRole', type: 'text', label: 'Pattern role', description: 'Palette role read for the pattern on theme change. Default "divider".' },
];

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

/**
 * The full BackgroundLayer field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<BackgroundLayerEditorPanel>`. The Pattern section is elided
 * for a solid fill.
 */
export function backgroundLayerFields(values: BackgroundLayerFields = {}): FieldConfig[] {
  return [
    ...FILL_FIELDS.map(withGroup('Fill')),
    ...(values.type === 'pattern' ? PATTERN_FIELDS.map(withGroup('Pattern')) : []),
    ...THEME_FIELDS.map(withGroup('Theme')),
  ];
}
