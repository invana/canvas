import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DragPanBehaviour editor. Field `name`s
 * match the keys of `DragPanFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
export const dragPanFields: FieldConfig[] = [
  {
    name: 'modifier',
    type: 'select',
    label: 'Modifier key',
    description: 'Which key must be held to pan. `none` = any left-drag pans.',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Space', value: 'space' },
      { label: 'Shift', value: 'shift' },
      { label: 'Alt / Option', value: 'alt' },
    ],
  },
  {
    name: 'mouseButtons',
    type: 'select',
    label: 'Mouse buttons',
    description: 'Which mouse buttons trigger a pan drag.',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
      { label: 'Middle', value: 'middle' },
    ],
  },
  {
    name: 'decelerate',
    type: 'boolean',
    label: 'Decelerate',
    description: 'Add momentum glide after the pointer lifts.',
  },
  {
    name: 'dragCursor',
    type: 'text',
    label: 'Drag cursor',
    description: "CSS cursor shown while panning. Default 'grabbing'.",
  },
];
