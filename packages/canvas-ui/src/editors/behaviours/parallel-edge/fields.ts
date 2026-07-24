import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ParallelEdgeBehaviour editor. Field
 * `name`s match the keys of `ParallelEdgeFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. Static — no field depends
 * on another's value.
 */
export const parallelEdgeFields: FieldConfig[] = [
  {
    name: 'spacing',
    type: 'number',
    label: 'Spacing',
    min: 0,
    step: 1,
    description: 'Gap between adjacent ranks in world units. Default 12.',
  },
  {
    name: 'basis',
    type: 'select',
    label: 'Basis',
    description: 'How a rank is translated into a fan direction.',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'perpendicular', label: 'Perpendicular' },
      { value: 'axis-aligned', label: 'Axis-aligned' },
    ],
  },
  {
    name: 'anchorOffset',
    type: 'boolean',
    label: 'Anchor offset',
    description: 'Fan port-anchored endpoints along the host face, not just waypoints.',
  },
];
