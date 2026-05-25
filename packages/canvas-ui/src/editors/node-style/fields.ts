import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../presets/colors';
import type { NodeStyleFields, ShapeKind } from './types';

/**
 * `@invana/forms` field schemas for the NodeStyle editor. Field `name`s match
 * the keys of {@link NodeStyleFields} 1:1 so the generator's `style.<name>`
 * paths line up with the mapping in `mapping.ts`. {@link nodeStyleFields}
 * assembles them into the grouped default schema `<NodeStyleEditor>` renders.
 *
 * Adding a control = adding a `FieldConfig` here (plus the matching key in
 * `NodeStyleFields` and a `mapping.ts` line) — no bespoke JSX.
 */

const SHAPE_KIND_FIELD: FieldConfig = {
  name: 'shapeKind',
  type: 'select',
  label: 'Shape',
  options: [
    { value: 'circle', label: 'Circle' },
    { value: 'rect', label: 'Rectangle' },
    { value: 'regular-polygon', label: 'Regular polygon' },
    { value: 'star', label: 'Star' },
  ],
};

const SIZE_FIELD: FieldConfig = {
  name: 'size',
  type: 'number',
  label: 'Size',
  min: 0,
  max: 200,
  step: 1,
  description: "Unified radius / half-extent. Overrides the shape's native size axis.",
};

/** Per-kind geometry numerics, keyed by shape kind. */
const GEOMETRY_BY_KIND: Record<ShapeKind, FieldConfig[]> = {
  circle: [{ name: 'radius', type: 'number', label: 'Radius', min: 0, max: 200, step: 1 }],
  rect: [
    { name: 'width', type: 'number', label: 'Width', min: 0, max: 400, step: 1 },
    { name: 'height', type: 'number', label: 'Height', min: 0, max: 400, step: 1 },
    { name: 'cornerRadius', type: 'number', label: 'Corner radius', min: 0, max: 200, step: 1 },
  ],
  'regular-polygon': [
    { name: 'sides', type: 'number', label: 'Sides', min: 3, max: 20, step: 1 },
    { name: 'radius', type: 'number', label: 'Radius', min: 0, max: 200, step: 1 },
  ],
  star: [
    { name: 'points', type: 'number', label: 'Points', min: 3, max: 20, step: 1 },
    { name: 'innerRadius', type: 'number', label: 'Inner radius', min: 0, max: 200, step: 1 },
    { name: 'outerRadius', type: 'number', label: 'Outer radius', min: 0, max: 200, step: 1 },
  ],
} as Record<ShapeKind, FieldConfig[]>;

/**
 * Geometry-tab fields for the current shape kind. Dynamic: the per-kind
 * numerics (radius / width-height / sides / points…) change with the watched
 * `shapeKind`, which is how the form-generator handles the discriminated
 * union. Falls back to no geometry numerics until a kind is chosen.
 */
export function geometryFields(kind: ShapeKind | undefined): FieldConfig[] {
  const geometry = kind ? (GEOMETRY_BY_KIND[kind] ?? []) : [];
  return [SHAPE_KIND_FIELD, ...geometry, SIZE_FIELD];
}

export const BACKGROUND_FIELDS: FieldConfig[] = [
  {
    name: 'bgFill',
    type: 'color',
    label: 'Fill color',
    presetColors: [...COLOR_PRESETS],
    description: 'Solid color. Use the engine API directly for stacked / image / glyph fills.',
  },
  { name: 'bgAlpha', type: 'number', label: 'Fill alpha', min: 0, max: 1, step: 0.01 },
];

export const STROKE_FIELDS: FieldConfig[] = [
  { name: 'bgStrokeColor', type: 'color', label: 'Stroke color', presetColors: [...COLOR_PRESETS] },
  { name: 'bgStrokeAlpha', type: 'number', label: 'Stroke alpha', min: 0, max: 1, step: 0.01 },
  { name: 'bgStrokeWidth', type: 'number', label: 'Stroke width', min: 0, max: 50, step: 0.5 },
  {
    name: 'bgStrokeAlignment',
    type: 'select',
    label: 'Stroke alignment',
    options: [
      { value: 'inside', label: 'Inside' },
      { value: 'center', label: 'Center' },
      { value: 'outside', label: 'Outside' },
    ],
  },
  {
    name: 'bgStrokeDashLength',
    type: 'number',
    label: 'Dash length',
    min: 0,
    max: 50,
    step: 1,
    description: 'Leave dash + gap at 0 for a solid stroke.',
  },
  { name: 'bgStrokeDashGap', type: 'number', label: 'Dash gap', min: 0, max: 50, step: 1 },
  {
    name: 'bgStrokeCap',
    type: 'select',
    label: 'Cap',
    options: [
      { value: 'butt', label: 'Butt' },
      { value: 'round', label: 'Round' },
      { value: 'square', label: 'Square' },
    ],
  },
  {
    name: 'bgStrokeJoin',
    type: 'select',
    label: 'Join',
    options: [
      { value: 'miter', label: 'Miter' },
      { value: 'round', label: 'Round' },
      { value: 'bevel', label: 'Bevel' },
    ],
  },
];

export const LABEL_FIELDS: FieldConfig[] = [
  { name: 'labelText', type: 'text', label: 'Text', placeholder: '(uses node id / data field)' },
  { name: 'labelColor', type: 'color', label: 'Color', presetColors: [...COLOR_PRESETS] },
  { name: 'labelFontSize', type: 'number', label: 'Font size', min: 1, max: 120, step: 1 },
  { name: 'labelFontWeight', type: 'number', label: 'Font weight', min: 100, max: 900, step: 100 },
  {
    name: 'labelPlacement',
    type: 'select',
    label: 'Placement',
    description: 'inside-* placements clip / truncate to fit the shape.',
    options: [
      { value: 'center', label: 'Center (anchor)' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'top-left', label: 'Top-left' },
      { value: 'top-right', label: 'Top-right' },
      { value: 'bottom-left', label: 'Bottom-left' },
      { value: 'bottom-right', label: 'Bottom-right' },
      { value: 'inside-center', label: 'Inside center (contained)' },
      { value: 'inside-top', label: 'Inside top' },
      { value: 'inside-bottom', label: 'Inside bottom' },
      { value: 'inside-left', label: 'Inside left' },
      { value: 'inside-right', label: 'Inside right' },
    ],
  },
  { name: 'labelOffsetX', type: 'number', label: 'Offset X', min: -200, max: 200, step: 1 },
  { name: 'labelOffsetY', type: 'number', label: 'Offset Y', min: -200, max: 200, step: 1 },
];

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

/**
 * The full NodeStyle field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<NodeStyleEditor>`. `@invana/forms` renders each `group` as an
 * accordion section. Geometry numerics vary with the current `shapeKind`
 * (the discriminated union), so this is a function of the live values.
 */
export function nodeStyleFields(values: NodeStyleFields = {}): FieldConfig[] {
  return [
    ...geometryFields(values.shapeKind).map(withGroup('Geometry')),
    ...BACKGROUND_FIELDS.map(withGroup('Background')),
    ...STROKE_FIELDS.map(withGroup('Stroke')),
    ...LABEL_FIELDS.map(withGroup('Label')),
  ];
}
