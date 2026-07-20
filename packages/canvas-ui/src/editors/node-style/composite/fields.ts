import type { FieldConfig } from '@invana/forms';

import { COLOR_PRESETS } from '../../../shared/colors';
import type { CompositePartKind, CompositeRootKind, CompositeScalarFields } from './types';

/**
 * `@invana/forms` field schemas for {@link CompositeNodeStyleEditor}. Field
 * `name`s match {@link CompositeScalarFields} / {@link CompositePartRow} 1:1 so
 * the generator's `composite.<name>` / `parts.${i}.<name>` paths line up with
 * `mapping.ts`.
 *
 * Two dynamic discriminators, both mirroring the simple editor's
 * `geometryFields(shapeKind)` pattern:
 *  - {@link compositeScalarFields} varies the **Root** numerics with `rootKind`,
 *  - {@link partRowFields} varies each parts row's controls with its `part` kind.
 */

// ─── Body ──────────────────────────────────────────────────────────────────

/** The card body fill colour — the composite editor's sole **Basics** control
 * (see {@link basicCompositeFields}). */
const BODY_FILL_FIELD: FieldConfig = {
  name: 'fill',
  type: 'color',
  label: 'Card color',
  presetColors: [...COLOR_PRESETS],
};

const BODY_SIZE_FIELDS: FieldConfig[] = [
  { name: 'width', type: 'number', label: 'Width', min: 0, max: 1000, step: 1 },
  { name: 'height', type: 'number', label: 'Height', min: 0, max: 1000, step: 1 },
  {
    name: 'cornerRadius',
    type: 'number',
    label: 'Corner radius',
    min: 0,
    max: 200,
    step: 1,
    description: 'Rounds the default rounded-rect body. Ignored when a Root shape is set.',
  },
];

const BODY_PAINT_FIELDS: FieldConfig[] = [
  { name: 'fillAlpha', type: 'number', label: 'Fill alpha', min: 0, max: 1, step: 0.01 },
  { name: 'strokeColor', type: 'color', label: 'Stroke color', presetColors: [...COLOR_PRESETS] },
  { name: 'strokeWidth', type: 'number', label: 'Stroke width', min: 0, max: 50, step: 0.5 },
  { name: 'strokeAlpha', type: 'number', label: 'Stroke alpha', min: 0, max: 1, step: 0.01 },
  {
    name: 'clip',
    type: 'boolean',
    label: 'Clip parts to silhouette',
    description: 'Edge-touching parts (accent bar, header) follow the rounded corners.',
  },
];

/** Body controls **beyond** the fill colour — all **Advanced**. */
const BODY_ADVANCED_FIELDS: FieldConfig[] = [...BODY_SIZE_FIELDS, ...BODY_PAINT_FIELDS];

/** The full body field set (fill in its original slot) — kept for the
 * back-compat {@link compositeScalarFields} export. */
const BODY_FIELDS: FieldConfig[] = [...BODY_SIZE_FIELDS, BODY_FILL_FIELD, ...BODY_PAINT_FIELDS];

// ─── Root silhouette (discriminated by rootKind) ─────────────────────────────

const ROOT_KIND_FIELD: FieldConfig = {
  name: 'rootKind',
  type: 'select',
  label: 'Root shape',
  description: 'Silhouette the card borrows. Body fill / stroke paint it.',
  options: [
    { value: 'none', label: '(default rounded rect)' },
    { value: 'rect', label: 'Rectangle' },
    { value: 'circle', label: 'Circle' },
    { value: 'regular-polygon', label: 'Regular polygon' },
    { value: 'star', label: 'Star' },
  ],
};

/** Per-kind root geometry numerics, keyed by root kind (`'none'` → none). */
const ROOT_GEOMETRY_BY_KIND: Record<CompositeRootKind, FieldConfig[]> = {
  none: [],
  rect: [
    { name: 'rootWidth', type: 'number', label: 'Root width', min: 0, max: 1000, step: 1 },
    { name: 'rootHeight', type: 'number', label: 'Root height', min: 0, max: 1000, step: 1 },
    { name: 'rootCornerRadius', type: 'number', label: 'Root corner radius', min: 0, max: 200, step: 1 },
  ],
  circle: [{ name: 'rootRadius', type: 'number', label: 'Root radius', min: 0, max: 500, step: 1 }],
  'regular-polygon': [
    { name: 'rootSides', type: 'number', label: 'Sides', min: 3, max: 20, step: 1 },
    { name: 'rootRadius', type: 'number', label: 'Root radius', min: 0, max: 500, step: 1 },
  ],
  star: [
    { name: 'rootPoints', type: 'number', label: 'Points', min: 3, max: 20, step: 1 },
    { name: 'rootInnerRadius', type: 'number', label: 'Inner radius', min: 0, max: 500, step: 1 },
    { name: 'rootOuterRadius', type: 'number', label: 'Outer radius', min: 0, max: 500, step: 1 },
  ],
};

/** Root-tab fields for the current `rootKind` (kind select + its geometry). */
export function rootFields(kind: CompositeRootKind | undefined): FieldConfig[] {
  const geometry = kind ? (ROOT_GEOMETRY_BY_KIND[kind] ?? []) : [];
  return [ROOT_KIND_FIELD, ...geometry];
}

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

/**
 * The **Basics** scalar field set — the single card body fill colour, shown
 * up-front and ungrouped. Everything else (body size / stroke / clip, the root
 * silhouette) lives in {@link advancedCompositeScalarFields}. A function of the
 * values for symmetry with the advanced set.
 */
export function basicCompositeFields(_values: CompositeScalarFields = {}): FieldConfig[] {
  return [BODY_FILL_FIELD];
}

/**
 * The **Advanced** scalar field set — everything beyond the body fill, grouped
 * into **Body** (size + paint) and **Root** (silhouette) accordion sections; the
 * Root numerics vary with `rootKind`. Rendered inside the editor's collapsed
 * "Advanced settings" disclosure, above the parts list.
 */
export function advancedCompositeScalarFields(values: CompositeScalarFields = {}): FieldConfig[] {
  return [
    ...BODY_ADVANCED_FIELDS.map(withGroup('Body')),
    ...rootFields(values.rootKind).map(withGroup('Root')),
  ];
}

/**
 * The composite body + root field set as one grouped `FieldConfig[]` — basics
 * (fill) folded back into the Body group. Retained as the `fields`-override /
 * back-compat export; the default editor render is the two-tier basics +
 * collapsed-advanced layout.
 */
export function compositeScalarFields(values: CompositeScalarFields = {}): FieldConfig[] {
  return [
    ...BODY_FIELDS.map(withGroup('Body')),
    ...rootFields(values.rootKind).map(withGroup('Root')),
  ];
}

// ─── Parts (discriminated by part kind) ──────────────────────────────────────

const PART_KIND_FIELD: FieldConfig = {
  name: 'part',
  type: 'select',
  label: 'Part',
  options: [
    { value: 'rect', label: 'Rect' },
    { value: 'circle', label: 'Circle' },
    { value: 'line', label: 'Line' },
    { value: 'label', label: 'Label' },
    { value: 'icon', label: 'Icon' },
  ],
};

const POS_FIELDS: FieldConfig[] = [
  { name: 'x', type: 'number', label: 'X', step: 1 },
  { name: 'y', type: 'number', label: 'Y', step: 1 },
];

/** Solid fill sugar shared by `rect` / `circle` parts. */
const PART_FILL_FIELDS: FieldConfig[] = [
  { name: 'fill', type: 'color', label: 'Fill', presetColors: [...COLOR_PRESETS] },
  { name: 'fillAlpha', type: 'number', label: 'Fill alpha', min: 0, max: 1, step: 0.01 },
];

/** Solid stroke sugar shared by `rect` / `circle` / `line` parts. */
const PART_STROKE_FIELDS: FieldConfig[] = [
  { name: 'strokeColor', type: 'color', label: 'Stroke', presetColors: [...COLOR_PRESETS] },
  { name: 'strokeWidth', type: 'number', label: 'Stroke width', min: 0, max: 50, step: 0.5 },
  { name: 'strokeAlpha', type: 'number', label: 'Stroke alpha', min: 0, max: 1, step: 0.01 },
];

const HIT_ID_FIELD: FieldConfig = {
  name: 'hitId',
  type: 'text',
  label: 'Hit id',
  placeholder: '(addressable sub-part)',
};

const LABEL_PART_FIELDS: FieldConfig[] = [
  { name: 'text', type: 'text', label: 'Text' },
  {
    name: 'anchor',
    type: 'select',
    label: 'Anchor',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
  },
  { name: 'fontSize', type: 'number', label: 'Font size', min: 1, max: 200, step: 1 },
  { name: 'fontWeight', type: 'number', label: 'Font weight', min: 100, max: 900, step: 100 },
  {
    name: 'fontStyle',
    type: 'select',
    label: 'Font style',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'italic', label: 'Italic' },
    ],
  },
  { name: 'labelFill', type: 'color', label: 'Text color', presetColors: [...COLOR_PRESETS] },
  { name: 'lineHeight', type: 'number', label: 'Line height', min: 0, max: 200, step: 1 },
  {
    name: 'align',
    type: 'select',
    label: 'Align',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
  },
  { name: 'maxWidth', type: 'number', label: 'Max width', min: 0, max: 1000, step: 1 },
  { name: 'maxLines', type: 'number', label: 'Max lines', min: 1, max: 20, step: 1 },
  {
    name: 'overflow',
    type: 'select',
    label: 'Overflow',
    options: [
      { value: 'clip', label: 'Clip' },
      { value: 'ellipsis', label: 'Ellipsis' },
    ],
  },
];

const ICON_PART_FIELDS: FieldConfig[] = [
  { name: 'size', type: 'number', label: 'Size', min: 0, max: 400, step: 1 },
  {
    name: 'iconKind',
    type: 'select',
    label: 'Icon kind',
    options: [
      { value: 'glyph', label: 'Glyph (icon-font / emoji)' },
      { value: 'svg-url', label: 'SVG URL' },
    ],
  },
  { name: 'iconChar', type: 'text', label: 'Glyph char', placeholder: 'e.g. ★ or \\ue800' },
  { name: 'iconUrl', type: 'text', label: 'SVG URL', placeholder: 'https://…/icon.svg' },
  { name: 'iconColor', type: 'color', label: 'Icon color', presetColors: [...COLOR_PRESETS] },
  {
    name: 'iconBackgroundFill',
    type: 'color',
    label: 'Chip background',
    presetColors: [...COLOR_PRESETS],
    description: 'Optional coloured square behind the glyph (the type-tag look).',
  },
];

/**
 * Controls for one parts row, chosen by its `part` kind — the discriminated
 * union the parts `useFieldArray` renders per row. Undefined kind → just the
 * kind select (until a value settles).
 */
export function partRowFields(kind: CompositePartKind | undefined): FieldConfig[] {
  switch (kind) {
    case 'rect':
      return [
        PART_KIND_FIELD,
        ...POS_FIELDS,
        { name: 'width', type: 'number', label: 'Width', min: 0, max: 1000, step: 1 },
        { name: 'height', type: 'number', label: 'Height', min: 0, max: 1000, step: 1 },
        { name: 'cornerRadius', type: 'number', label: 'Corner radius', min: 0, max: 200, step: 1 },
        ...PART_FILL_FIELDS,
        ...PART_STROKE_FIELDS,
        HIT_ID_FIELD,
      ];
    case 'circle':
      return [
        PART_KIND_FIELD,
        ...POS_FIELDS,
        { name: 'radius', type: 'number', label: 'Radius', min: 0, max: 500, step: 1 },
        ...PART_FILL_FIELDS,
        ...PART_STROKE_FIELDS,
        HIT_ID_FIELD,
      ];
    case 'line':
      return [
        PART_KIND_FIELD,
        ...POS_FIELDS,
        { name: 'x2', type: 'number', label: 'X2', step: 1 },
        { name: 'y2', type: 'number', label: 'Y2', step: 1 },
        ...PART_STROKE_FIELDS,
      ];
    case 'icon':
      return [PART_KIND_FIELD, ...POS_FIELDS, ...ICON_PART_FIELDS, HIT_ID_FIELD];
    case 'label':
      return [PART_KIND_FIELD, ...POS_FIELDS, ...LABEL_PART_FIELDS];
    default:
      return [PART_KIND_FIELD];
  }
}
