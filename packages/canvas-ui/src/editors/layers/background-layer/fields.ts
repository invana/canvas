import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';
import type { BackgroundLayerFields } from './types';

/**
 * `@invana/forms` field schema for the BackgroundLayer editor, grouped into
 * accordion sections. Field `name`s match {@link BackgroundLayerFields} 1:1.
 *
 * A function of the live values, in two ways: the Pattern section only appears
 * when `type === 'pattern'` (dot/line/grid controls are meaningless for a solid
 * fill), and each colour's swatch only appears when its **Source** is `Custom`
 * — a themed colour has no swatch to show, it has a palette role.
 */

/**
 * The `Source` select that fronts a colour field. `Theme` maps to the engine's
 * `'inherit'`, which follows the layer's palette role and recolours on every
 * theme switch; `Custom` pins the swatch's colour so the theme never touches it.
 */
const sourceField = (name: string, label: string, role: string): FieldConfig => ({
  name,
  type: 'select',
  label,
  row: name,
  options: [
    { value: 'theme', label: 'Theme' },
    { value: 'custom', label: 'Custom' },
  ],
  description: `Theme follows the palette's "${role}" role; Custom pins the colour you pick.`,
});

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

/** The backdrop colour swatch — rendered only when its source is `Custom`. */
const BACKGROUND_COLOR_FIELD: FieldConfig = {
  name: 'backgroundColor',
  type: 'color',
  label: 'Background color',
  row: 'backgroundColorSource',
  presetColors: [...COLOR_PRESETS],
  description: 'Solid backdrop painted behind the pattern.',
};

/** The pattern colour swatch — rendered only when its source is `Custom`. */
const PATTERN_COLOR_FIELD: FieldConfig = {
  name: 'color',
  type: 'color',
  label: 'Pattern color',
  row: 'colorSource',
  presetColors: [...COLOR_PRESETS],
  description: 'Dot / line / grid colour.',
};

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
  { name: 'size', type: 'number', label: 'Size', min: 0, max: 20, step: 0.5, description: 'Dot radius / line thickness, in texture pixels.' },
  { name: 'spacing', type: 'number', label: 'Spacing', min: 1, max: 100, step: 1, description: 'Tile cell spacing, in texture pixels.' },
  { name: 'alpha', type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 },
  {
    name: 'followCamera',
    type: 'boolean',
    label: 'Follow camera',
    description: 'Pattern shifts + scales with the camera when on.',
  },
  {
    name: 'hidePatternBelowZoom',
    type: 'number',
    label: 'Hide below zoom',
    min: 0,
    max: 2,
    step: 0.05,
    description: 'Hide the pattern under this camera scale (0.5 = 50%). Set 0 to always show it.',
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
  const fill: FieldConfig[] = [
    ...FILL_FIELDS,
    sourceField('backgroundColorSource', 'Background source', values.surfaceRole || 'surface'),
    ...(values.backgroundColorSource === 'custom' ? [BACKGROUND_COLOR_FIELD] : []),
  ];
  const pattern: FieldConfig[] = [
    ...PATTERN_FIELDS,
    sourceField('colorSource', 'Pattern source', values.patternRole || 'divider'),
    ...(values.colorSource === 'custom' ? [PATTERN_COLOR_FIELD] : []),
  ];
  return [
    ...fill.map(withGroup('Fill')),
    ...(values.type === 'pattern' ? pattern.map(withGroup('Pattern')) : []),
    ...THEME_FIELDS.map(withGroup('Theme')),
  ];
}
