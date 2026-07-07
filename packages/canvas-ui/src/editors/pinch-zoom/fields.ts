import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the PinchZoomBehaviour editor. Field `name`s
 * match the keys of `PinchZoomFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
export const pinchZoomFields: FieldConfig[] = [
  {
    name: 'noDrag',
    type: 'boolean',
    label: 'No drag',
    description: 'Pinch only zooms; suppress the implicit two-finger pan.',
  },
  {
    name: 'percent',
    type: 'number',
    label: 'Zoom speed',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Zoom speed multiplier. Default 0.1 (10%).',
  },
];
