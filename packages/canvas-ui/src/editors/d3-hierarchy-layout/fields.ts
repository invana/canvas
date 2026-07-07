import type { FieldConfig } from '@invana/forms';

import type { D3HierarchyLayoutFields, D3HierarchyLayoutMode } from './types';

/**
 * `@invana/forms` field schema for the D3HierarchyLayout editor, grouped into
 * accordion sections. Field `name`s match {@link D3HierarchyLayoutFields} 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 *
 * A function of the live values: the per-mode numerics swap with the watched
 * `mode` — Cartesian modes (`tree` / `cluster`) show orientation + size,
 * `radial-*` show radius, `pack` shows padding.
 */

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const MODE_FIELD: FieldConfig = {
  name: 'mode',
  type: 'select',
  label: 'Mode',
  description: 'Hierarchy layout family. Default `radial-tree`.',
  options: [
    { value: 'tree', label: 'Tree' },
    { value: 'cluster', label: 'Cluster' },
    { value: 'radial-tree', label: 'Radial tree' },
    { value: 'radial-cluster', label: 'Radial cluster' },
    { value: 'pack', label: 'Pack' },
    { value: 'sunburst', label: 'Sunburst' },
  ],
};

const ROOT_FIELD: FieldConfig = {
  name: 'rootId',
  type: 'text',
  label: 'Root id',
  placeholder: 'auto-detected',
  description: 'Explicit tree root. Auto-detected (unique node with no parent) when blank.',
};

const ORIENTATION_FIELD: FieldConfig = {
  name: 'orientation',
  type: 'select',
  label: 'Orientation',
  description: 'Cartesian depth axis. Default `vertical`.',
  options: [
    { value: 'vertical', label: 'Vertical' },
    { value: 'horizontal', label: 'Horizontal' },
  ],
};

const SIZE_FIELDS: FieldConfig[] = [
  { name: 'sizeWidth', type: 'number', label: 'Size width', min: 0, max: 20000, step: 10, description: 'Cartesian layout width. Default 640 (with height).' },
  { name: 'sizeHeight', type: 'number', label: 'Size height', min: 0, max: 20000, step: 10, description: 'Cartesian layout height. Default 480 (with width).' },
  { name: 'nodeSizeX', type: 'number', label: 'Node size X', min: 0, max: 5000, step: 1, description: 'Per-node horizontal spacing. Mutually exclusive with Size.' },
  { name: 'nodeSizeY', type: 'number', label: 'Node size Y', min: 0, max: 5000, step: 1, description: 'Per-node vertical spacing. Mutually exclusive with Size.' },
];

const RADIUS_FIELD: FieldConfig = {
  name: 'radius',
  type: 'number',
  label: 'Radius',
  min: 0,
  max: 10000,
  step: 10,
  description: 'Polar radius for radial modes. Default 400.',
};

const PADDING_FIELD: FieldConfig = {
  name: 'padding',
  type: 'number',
  label: 'Padding',
  min: 0,
  max: 500,
  step: 1,
  description: 'Pack-only: padding between sibling circles. Default 0.',
};

const POSITION_FIELDS: FieldConfig[] = [
  { name: 'centerX', type: 'number', label: 'Center X', min: -10000, max: 10000, step: 10 },
  { name: 'centerY', type: 'number', label: 'Center Y', min: -10000, max: 10000, step: 10 },
];

const TRANSITION_FIELDS: FieldConfig[] = [
  { name: 'transition', type: 'boolean', label: 'Animate', description: 'Glide nodes to their new positions (ignored for pack / sunburst).' },
  { name: 'transitionEase', type: 'text', label: 'Ease', placeholder: 'e.g. cubic-in-out' },
];

const isCartesian = (mode?: D3HierarchyLayoutMode) => mode === 'tree' || mode === 'cluster';
const isRadial = (mode?: D3HierarchyLayoutMode) =>
  mode === 'radial-tree' || mode === 'radial-cluster';

/** Per-mode geometry fields for the current mode. */
function modeFields(mode?: D3HierarchyLayoutMode): FieldConfig[] {
  if (isCartesian(mode)) return [ORIENTATION_FIELD, ...SIZE_FIELDS];
  if (isRadial(mode)) return [RADIUS_FIELD];
  if (mode === 'pack') return [PADDING_FIELD];
  return []; // sunburst — only mode / root / center apply
}

/**
 * The full D3HierarchyLayout field set as one grouped `FieldConfig[]` — the
 * default `fields` for `<D3HierarchyLayoutEditor>`. Layout numerics vary with
 * the current `mode`.
 */
export function d3HierarchyLayoutFields(
  values: D3HierarchyLayoutFields = {},
): FieldConfig[] {
  return [
    ...[MODE_FIELD, ROOT_FIELD, ...modeFields(values.mode)].map(withGroup('Layout')),
    ...POSITION_FIELDS.map(withGroup('Position')),
    ...TRANSITION_FIELDS.map(withGroup('Transition')),
  ];
}
