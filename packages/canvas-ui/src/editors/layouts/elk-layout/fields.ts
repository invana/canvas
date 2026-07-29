import type { FieldConfig } from '@invana/forms';

import type { ElkLayoutFields } from './types';

/**
 * `@invana/forms` field schema for the ElkLayout editor, grouped into accordion
 * sections. Field `name`s match {@link ElkLayoutFields} 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 *
 * A function of the live values: `layerSpacing` is `layered`-only, so it only
 * appears while the `layered` algorithm is selected.
 */

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const ALGORITHM_FIELD: FieldConfig = {
  name: 'algorithm',
  type: 'select',
  label: 'Algorithm',
  description: 'ELK layout algorithm. `layered` (Sugiyama) is the default for directed graphs.',
  options: [
    { value: 'layered', label: 'Layered (Sugiyama)' },
    { value: 'mrtree', label: 'Tree (mrtree)' },
    { value: 'radial', label: 'Radial' },
    { value: 'force', label: 'Force' },
    { value: 'stress', label: 'Stress' },
    { value: 'disco', label: 'Disconnected packing' },
    { value: 'box', label: 'Box packing' },
    { value: 'rectpacking', label: 'Rect packing' },
    { value: 'random', label: 'Random' },
    { value: 'fixed', label: 'Fixed' },
  ],
};

const DIRECTION_FIELD: FieldConfig = {
  name: 'direction',
  type: 'select',
  label: 'Direction',
  description: 'Primary layout axis. Respected by `layered`, `mrtree`, …',
  options: [
    { value: 'RIGHT', label: 'Right' },
    { value: 'LEFT', label: 'Left' },
    { value: 'DOWN', label: 'Down' },
    { value: 'UP', label: 'Up' },
  ],
};

const LAYER_SPACING_FIELD: FieldConfig = {
  name: 'layerSpacing',
  type: 'number',
  label: 'Layer spacing',
  min: 0,
  max: 1000,
  step: 1,
  description: 'Gap between consecutive layers (layered algorithm only).',
};

const NODE_SPACING_FIELD: FieldConfig = {
  name: 'nodeSpacing',
  type: 'number',
  label: 'Node spacing',
  min: 0,
  max: 1000,
  step: 1,
  description: 'Minimum gap between sibling nodes.',
};

const OTHER_SPACING_FIELDS: FieldConfig[] = [
  { name: 'edgeNodeSpacing', type: 'number', label: 'Edge–node spacing', min: 0, max: 1000, step: 1, description: 'Gap between an edge and a node.' },
  { name: 'edgeSpacing', type: 'number', label: 'Edge spacing', min: 0, max: 1000, step: 1, description: 'Gap between parallel edges.' },
  { name: 'padding', type: 'number', label: 'Padding', min: 0, max: 1000, step: 1, description: 'Symmetric graph-level padding.' },
];

const EDGE_FIELDS: FieldConfig[] = [
  {
    name: 'edgeRouting',
    type: 'select',
    label: 'Edge routing',
    description: 'Node-avoiding edge geometry written back as waypoints. `ORTHOGONAL` suits layered graphs.',
    options: [
      { value: 'ORTHOGONAL', label: 'Orthogonal' },
      { value: 'POLYLINE', label: 'Polyline' },
      { value: 'SPLINES', label: 'Splines' },
    ],
  },
];

const NODE_SIZE_FIELDS: FieldConfig[] = [
  { name: 'defaultNodeWidth', type: 'number', label: 'Default node width', min: 1, max: 1000, step: 1, description: 'Fallback width when a node has no resolvable shape. Default 40.' },
  { name: 'defaultNodeHeight', type: 'number', label: 'Default node height', min: 1, max: 1000, step: 1, description: 'Fallback height when a node has no resolvable shape. Default 40.' },
];

const GROUP_FIELDS: FieldConfig[] = [
  { name: 'includeGroups', type: 'boolean', label: 'Nest groups', description: 'Default on. Groups become nested containers with their members packed inside the frame; plain parent/child trees are unaffected.' },
];

const TRANSITION_FIELDS: FieldConfig[] = [
  { name: 'transition', type: 'boolean', label: 'Animate', description: 'Glide nodes to their new positions instead of snapping.' },
  { name: 'transitionEase', type: 'text', label: 'Ease', placeholder: 'e.g. cubic-in-out' },
];

/**
 * The full ElkLayout field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<ElkLayoutEditorPanel>`. The `layered`-only `layerSpacing` input
 * appears only when the `layered` algorithm is selected.
 */
export function elkLayoutFields(values: ElkLayoutFields = {}): FieldConfig[] {
  const spacing =
    values.algorithm === 'layered'
      ? [NODE_SPACING_FIELD, LAYER_SPACING_FIELD, ...OTHER_SPACING_FIELDS]
      : [NODE_SPACING_FIELD, ...OTHER_SPACING_FIELDS];
  return [
    ...[ALGORITHM_FIELD, DIRECTION_FIELD].map(withGroup('Algorithm')),
    ...spacing.map(withGroup('Spacing')),
    ...EDGE_FIELDS.map(withGroup('Edges')),
    ...NODE_SIZE_FIELDS.map(withGroup('Node size')),
    ...GROUP_FIELDS.map(withGroup('Groups')),
    ...TRANSITION_FIELDS.map(withGroup('Transition')),
  ];
}
