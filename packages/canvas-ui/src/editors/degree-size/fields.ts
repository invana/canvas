import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DegreeSizeBehaviour editor. Field
 * `name`s match the keys of `DegreeSizeFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. Static — none of the
 * inputs depend on another field's value.
 */
export const degreeSizeFields: FieldConfig[] = [
  {
    name: 'direction',
    type: 'select',
    label: 'Direction',
    description: 'Edges counted per node when computing degree.',
    options: [
      { value: 'in', label: 'In' },
      { value: 'out', label: 'Out' },
      { value: 'both', label: 'Both' },
    ],
  },
  {
    name: 'minSize',
    type: 'number',
    label: 'Min size',
    min: 0,
    step: 1,
    description: 'Output size for a node with degree 0. Default 8.',
  },
  {
    name: 'maxSize',
    type: 'number',
    label: 'Max size',
    min: 0,
    step: 1,
    description: 'Output size for the max-degree node. Default 32.',
  },
  {
    name: 'scale',
    type: 'select',
    label: 'Scale',
    description: 'Curve mapping normalized degree to size.',
    options: [
      { value: 'linear', label: 'Linear' },
      { value: 'sqrt', label: 'Square root' },
      { value: 'log', label: 'Logarithmic' },
    ],
  },
];
