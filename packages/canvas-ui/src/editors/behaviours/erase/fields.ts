import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the EraseBehaviour editor. The `target` enum
 * (`'node' | 'edge' | 'both'`) renders as a select; the name matches
 * {@link import('./types').EraseFields} 1:1 so `options.target` lines up with
 * `mapping.ts`.
 */
export const eraseFields: FieldConfig[] = [
  {
    name: 'target',
    type: 'select',
    label: 'Erase target',
    description: 'Which element kinds a click removes. Erasing a node cascades its edges.',
    options: [
      { label: 'Nodes and edges', value: 'both' },
      { label: 'Nodes only', value: 'node' },
      { label: 'Edges only', value: 'edge' },
    ],
  },
];
