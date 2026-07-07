import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ColorByLabelBehaviour editor. Field
 * `name`s match {@link import('./types').ColorByLabelFields} 1:1 so the
 * `options.<name>` paths line up with `mapping.ts`. The `palette` array option
 * has no field here — `FieldType` has no array kind.
 */
export const colorByLabelFields: FieldConfig[] = [
  {
    name: 'colorNodes',
    type: 'boolean',
    label: 'Colour nodes',
    description: 'Fill each node with the colour assigned to its label. Default on.',
  },
  {
    name: 'colorEdges',
    type: 'boolean',
    label: 'Colour edges',
    description: 'Stroke each edge with the colour assigned to its label. Default on.',
  },
  {
    name: 'fallbackColor',
    type: 'color',
    label: 'Fallback colour',
    description: 'Colour for items whose label is missing or empty. Default grey.',
  },
];
