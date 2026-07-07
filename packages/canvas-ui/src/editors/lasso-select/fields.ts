import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../shared/colors';

/**
 * `@invana/forms` field schema for the LassoSelectBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `LassoSelectFields` 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 */
export const lassoSelectFields: FieldConfig[] = [
  {
    name: 'enableShapes',
    type: 'boolean',
    label: 'Select nodes',
    group: 'Selection',
    description: 'Include enclosed nodes in the lasso selection.',
  },
  {
    name: 'enableConnectors',
    type: 'boolean',
    label: 'Select edges',
    group: 'Selection',
    description: 'Include enclosed edges (both endpoints inside the polygon) in the selection.',
  },
  {
    name: 'trigger',
    type: 'select',
    label: 'Modifier gate',
    group: 'Selection',
    description: 'Modifier held on pointerdown to activate the lasso. "None" = any left-drag.',
    options: [
      { value: 'none', label: 'None' },
      { value: 'shift', label: 'Shift' },
      { value: 'control', label: 'Control' },
      { value: 'alt', label: 'Alt' },
      { value: 'meta', label: 'Meta' },
    ],
  },
  {
    name: 'immediately',
    type: 'boolean',
    label: 'Live update',
    group: 'Selection',
    description: 'Update the selection as the polygon grows. Off = apply on release.',
  },
  {
    name: 'state',
    type: 'text',
    label: 'State name',
    group: 'Selection',
    description: 'Visual state applied to lassoed elements on the fallback path. Default "selected".',
  },
  {
    name: 'clearOnBackground',
    type: 'boolean',
    label: 'Clear on background',
    group: 'Selection',
    description: 'Clear the selection on a background click (no drag).',
  },
  {
    name: 'styleFill',
    type: 'color',
    label: 'Fill color',
    group: 'Polygon',
    presetColors: [...COLOR_PRESETS],
    description: 'Lasso polygon fill colour.',
  },
  { name: 'styleFillAlpha', type: 'number', label: 'Fill alpha', group: 'Polygon', min: 0, max: 1, step: 0.01 },
  {
    name: 'styleStroke',
    type: 'color',
    label: 'Stroke color',
    group: 'Polygon',
    presetColors: [...COLOR_PRESETS],
    description: 'Polygon border colour.',
  },
  { name: 'styleStrokeAlpha', type: 'number', label: 'Stroke alpha', group: 'Polygon', min: 0, max: 1, step: 0.01 },
  {
    name: 'styleStrokeWidth',
    type: 'number',
    label: 'Stroke width',
    group: 'Polygon',
    min: 0,
    max: 10,
    step: 0.5,
    description: 'Border width in screen pixels (auto-divided by zoom).',
  },
];
