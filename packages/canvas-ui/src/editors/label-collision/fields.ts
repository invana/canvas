import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the LabelCollisionBehaviour editor. Field
 * `name`s match the keys of `LabelCollisionFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. The nested engine `groups`
 * object is edited as two flat text fields here.
 */
export const labelCollisionFields: FieldConfig[] = [
  {
    name: 'strategy',
    type: 'select',
    label: 'Strategy',
    description: 'What to do with overlapping labels.',
    options: [{ value: 'hide', label: 'Hide' }],
  },
  {
    name: 'prioritise',
    type: 'select',
    label: 'Prioritise by',
    description: 'How labels are ranked when resolving overlaps.',
    options: [
      { value: 'priority-field', label: 'Priority field' },
      { value: 'node-degree', label: 'Node degree' },
    ],
  },
  {
    name: 'flickerGuardMs',
    type: 'number',
    label: 'Flicker guard (ms)',
    min: 0,
    step: 10,
    description: 'Minimum hold before a just-flipped label can flip back. Default 100.',
  },
  {
    name: 'groupNodes',
    type: 'text',
    label: 'Node group',
    description: 'Collision group name for node labels. Default "nodes".',
  },
  {
    name: 'groupEdges',
    type: 'text',
    label: 'Edge group',
    description: 'Collision group name for edge labels. Default "edges".',
  },
];
