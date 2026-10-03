import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';

const MODIFIER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'alt', label: 'Alt' },
  { value: 'shift', label: 'Shift' },
  { value: 'ctrl', label: 'Ctrl' },
  { value: 'meta', label: 'Meta' },
];

/**
 * `@invana/forms` field schema for the FisheyeBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `FisheyeFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 */
export const fisheyeFields: FieldConfig[] = [
  {
    name: 'trigger',
    type: 'select',
    label: 'Move lens on',
    group: 'Lens',
    description: 'Pointer move = follows the cursor; Click = placed by a click; Drag = placed by a click, moved by dragging it.',
    options: [
      { value: 'pointermove', label: 'Pointer move' },
      { value: 'click', label: 'Click' },
      { value: 'drag', label: 'Drag' },
    ],
  },
  {
    name: 'radius',
    type: 'number',
    label: 'Radius (px)',
    group: 'Lens',
    min: 0,
    step: 5,
    description: 'Lens radius in screen pixels — same apparent size at any zoom. Default 120.',
  },
  {
    name: 'distortion',
    type: 'number',
    label: 'Distortion',
    group: 'Lens',
    min: 0,
    step: 0.1,
    description: 'How strongly the lens spreads nodes near its centre. 0 = none. Default 1.5.',
  },
  {
    name: 'nodeScale',
    type: 'number',
    label: 'Node scale',
    group: 'Lens',
    min: 0.1,
    step: 0.1,
    description: 'Node size multiplier at the lens centre, easing to 1 at the rim. 1 = no enlargement. Default 1.5.',
  },
  {
    name: 'showLabels',
    type: 'boolean',
    label: 'Show labels',
    group: 'Lens',
    description: 'Force labels visible inside the lens, even where text LOD or label collision hides them.',
  },
  {
    name: 'radiusWheelModifier',
    type: 'select',
    label: 'Radius wheel key',
    group: 'Wheel',
    description: 'Hold this key and scroll inside the lens to resize it. "None" disables.',
    options: MODIFIER_OPTIONS,
  },
  {
    name: 'distortionWheelModifier',
    type: 'select',
    label: 'Distortion wheel key',
    group: 'Wheel',
    description: 'Hold this key and scroll inside the lens to change the distortion. "None" disables.',
    options: MODIFIER_OPTIONS,
  },
  { name: 'minRadius', type: 'number', label: 'Min radius (px)', group: 'Wheel', min: 0, step: 5 },
  {
    name: 'maxRadius',
    type: 'number',
    label: 'Max radius (px)',
    group: 'Wheel',
    min: 0,
    step: 5,
    description: '0 = half the canvas’s shorter side.',
  },
  { name: 'minDistortion', type: 'number', label: 'Min distortion', group: 'Wheel', min: 0, step: 0.1 },
  { name: 'maxDistortion', type: 'number', label: 'Max distortion', group: 'Wheel', min: 0, step: 0.1 },
  {
    name: 'lensStrokeColor',
    type: 'color',
    label: 'Ring colour',
    group: 'Appearance',
    presetColors: [...COLOR_PRESETS],
  },
  { name: 'lensStrokeWidth', type: 'number', label: 'Ring width', group: 'Appearance', min: 0, max: 10, step: 0.5 },
  {
    name: 'lensFillColor',
    type: 'color',
    label: 'Fill colour',
    group: 'Appearance',
    presetColors: [...COLOR_PRESETS],
  },
  { name: 'lensFillAlpha', type: 'number', label: 'Fill alpha', group: 'Appearance', min: 0, max: 1, step: 0.01 },
];
