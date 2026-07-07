import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../shared/colors';

/**
 * `@invana/forms` field schema for the MiniMapLayer editor, grouped into
 * accordion sections. Field `name`s match `MiniMapLayerFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 */

const LAYOUT_FIELDS: FieldConfig[] = [
  { name: 'width', type: 'number', label: 'Width', min: 0, step: 10, description: 'Minimap width in screen px. Default 200.' },
  { name: 'height', type: 'number', label: 'Height', min: 0, step: 10, description: 'Minimap height in screen px. Default 150.' },
  {
    name: 'position',
    type: 'select',
    label: 'Position',
    description: 'Anchor corner inside the viewport.',
    options: [
      { value: 'top-left', label: 'Top-left' },
      { value: 'top-right', label: 'Top-right' },
      { value: 'bottom-left', label: 'Bottom-left' },
      { value: 'bottom-right', label: 'Bottom-right' },
    ],
  },
  { name: 'margin', type: 'number', label: 'Margin', min: 0, step: 1, description: 'Symmetric inset from the corner, in screen px. Default 10.' },
  { name: 'padding', type: 'number', label: 'Padding', min: 0, step: 1, description: 'World-space padding around node bounds. Default 20.' },
  { name: 'enableDrag', type: 'boolean', label: 'Enable drag', description: 'Dragging the minimap pans the main camera.' },
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

const CHROME_FIELDS: FieldConfig[] = [
  { name: 'backgroundColor', type: 'color', label: 'Background', presetColors: [...COLOR_PRESETS], description: 'Backdrop fill. Default #1a1a2e.' },
  { name: 'borderColor', type: 'color', label: 'Border color', presetColors: [...COLOR_PRESETS], description: 'Border stroke colour. Default #444444.' },
  { name: 'borderWidth', type: 'number', label: 'Border width', min: 0, step: 0.5 },
];

const VIEWPORT_FIELDS: FieldConfig[] = [
  { name: 'viewportFill', type: 'color', label: 'Viewport fill', presetColors: [...COLOR_PRESETS], description: 'Viewport indicator fill. Default #4a90d9.' },
  { name: 'viewportStroke', type: 'color', label: 'Viewport stroke', presetColors: [...COLOR_PRESETS], description: 'Viewport indicator stroke. Default #2a70b9.' },
  { name: 'viewportFillAlpha', type: 'number', label: 'Viewport fill alpha', min: 0, max: 1, step: 0.05 },
  { name: 'viewportStrokeWidth', type: 'number', label: 'Viewport stroke width', min: 0, step: 0.5 },
];

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

/**
 * The full MiniMapLayer field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<MiniMapLayerEditor>`. Static — no field depends on another's
 * value.
 */
export const miniMapLayerFields: FieldConfig[] = [
  ...LAYOUT_FIELDS.map(withGroup('Layout')),
  ...CHROME_FIELDS.map(withGroup('Chrome')),
  ...VIEWPORT_FIELDS.map(withGroup('Viewport')),
];
