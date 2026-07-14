import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the NodeCentralityBehaviour editor. Field
 * `name`s match the keys of `NodeCentralityFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. Static — none of the
 * inputs depend on another field's value.
 */
export const nodeCentralityFields: FieldConfig[] = [
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
  {
    name: 'labelScale',
    type: 'number',
    label: 'Label scale',
    min: 0,
    step: 0.05,
    description: 'Grow the label with the node: labelFontSize = size × this (clamped). 0 = off.',
  },
  {
    name: 'labelMinSize',
    type: 'number',
    label: 'Label min size',
    min: 0,
    step: 1,
    description: 'Lower clamp for the scaled label font. Default 8.',
  },
  {
    name: 'labelMaxSize',
    type: 'number',
    label: 'Label max size',
    min: 0,
    step: 1,
    description: 'Upper clamp for the scaled label font. Default 40.',
  },
];
