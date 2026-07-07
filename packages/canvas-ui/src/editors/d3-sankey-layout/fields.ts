import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the D3SankeyLayout editor, grouped into
 * accordion sections. Field `name`s match `D3SankeyLayoutFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 *
 * Static (no cross-field dependency) — a plain `FieldConfig[]`.
 */

const withGroup =
  (group: string) =>
  (f: FieldConfig): FieldConfig => ({ ...f, group });

const LAYOUT_FIELDS: FieldConfig[] = [
  {
    name: 'nodeAlign',
    type: 'select',
    label: 'Node align',
    description: 'Column-alignment strategy. Default `justify` (sources left, sinks right).',
    options: [
      { value: 'justify', label: 'Justify' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'center', label: 'Center' },
    ],
  },
  { name: 'nodeWidth', type: 'number', label: 'Node width', min: 1, max: 500, step: 1, description: 'Column rectangle width. Default 24.' },
  { name: 'nodePadding', type: 'number', label: 'Node padding', min: 0, max: 200, step: 1, description: 'Vertical gap between nodes in a column. Default 8.' },
  { name: 'iterations', type: 'number', label: 'Iterations', min: 1, max: 100, step: 1, description: 'Relaxation passes. More = tighter, slower. Default 6.' },
  { name: 'sizeWidth', type: 'number', label: 'Size width', min: 0, max: 20000, step: 10, description: 'Viewport width the layout fills. Default 1000 (with height).' },
  { name: 'sizeHeight', type: 'number', label: 'Size height', min: 0, max: 20000, step: 10, description: 'Viewport height the layout fills. Default 600 (with width).' },
];

const POSITION_FIELDS: FieldConfig[] = [
  { name: 'centerX', type: 'number', label: 'Center X', min: -10000, max: 10000, step: 10 },
  { name: 'centerY', type: 'number', label: 'Center Y', min: -10000, max: 10000, step: 10 },
];

/**
 * The full D3SankeyLayout field set as one grouped `FieldConfig[]` — the default
 * `fields` for `<D3SankeyLayoutEditor>`.
 */
export const d3SankeyLayoutFields: FieldConfig[] = [
  ...LAYOUT_FIELDS.map(withGroup('Layout')),
  ...POSITION_FIELDS.map(withGroup('Position')),
];
