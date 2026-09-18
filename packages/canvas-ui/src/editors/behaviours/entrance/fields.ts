import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the EntranceBehaviour editor, grouped into
 * accordion sections. Field `name`s match the keys of `EntranceFields` 1:1 so
 * the generator's `options.<name>` paths line up with `mapping.ts`.
 */
export const entranceFields: FieldConfig[] = [
  {
    name: 'durationMs',
    type: 'number',
    label: 'Fade duration',
    group: 'Timing',
    min: 1,
    max: 3000,
    step: 10,
    description: 'How long each element takes to fade in, in ms. Default 320.',
  },
  {
    name: 'staggerMs',
    type: 'number',
    label: 'Stagger per item',
    group: 'Timing',
    min: 0,
    max: 200,
    step: 1,
    description: 'Delay added per element along the sweep axis, in ms. 0 fades everything together.',
  },
  {
    name: 'maxStaggerMs',
    type: 'number',
    label: 'Max sweep length',
    group: 'Timing',
    min: 0,
    max: 5000,
    step: 50,
    description:
      'Ceiling on the whole sweep, in ms. The per-item step is compressed to fit, so a large graph still arrives promptly.',
  },
  {
    name: 'easing',
    type: 'select',
    label: 'Easing',
    group: 'Timing',
    description: 'Named curve for each fade. Named (not a function) so the setting stays serialisable.',
    options: [
      { value: 'easeOutCubic', label: 'Ease out cubic' },
      { value: 'easeOutQuad', label: 'Ease out quad' },
      { value: 'easeInOutSine', label: 'Ease in-out sine' },
      { value: 'easeInOutCubic', label: 'Ease in-out cubic' },
      { value: 'linear', label: 'Linear' },
    ],
  },
  {
    name: 'order',
    type: 'select',
    label: 'Sweep direction',
    group: 'Sweep',
    description: 'Axis the entrance reads along. "None" fades the whole scene at once.',
    options: [
      { value: 'x', label: 'Left to right' },
      { value: 'y', label: 'Top to bottom' },
      { value: 'none', label: 'None (all together)' },
    ],
  },
  {
    name: 'includeEdges',
    type: 'boolean',
    label: 'Fade edges',
    group: 'Sweep',
    description: 'Fade edges too, each behind the later of its two endpoints.',
  },
];
