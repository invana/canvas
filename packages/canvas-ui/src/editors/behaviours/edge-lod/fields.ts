import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the EdgeLODBehaviour editor. Field `name`s
 * match `EdgeLODFields` 1:1 so the generator's `options.<name>` paths line up
 * with `mapping.ts`.
 */
export const edgeLODFields: FieldConfig[] = [
  {
    name: 'minZoom',
    type: 'number',
    label: 'Thin below zoom',
    min: 0,
    step: 0.1,
    description: 'Thin edges when the camera scale is below this. Default 0.5.',
  },
  {
    name: 'keepFraction',
    type: 'number',
    label: 'Keep fraction',
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Fraction of edges kept visible when thinned (0..1). Default 0.1.',
  },
  {
    name: 'keepBy',
    type: 'select',
    label: 'Keep by',
    description: 'Which edges survive thinning.',
    options: [
      { value: 'sample', label: 'Sample (stable subset)' },
      { value: 'weight', label: 'Weight (highest)' },
      { value: 'degree', label: 'Degree (backbone)' },
    ],
  },
  {
    name: 'weightKey',
    type: 'text',
    label: 'Weight field',
    description: 'Numeric edge-data field used when Keep by = Weight.',
  },
];
