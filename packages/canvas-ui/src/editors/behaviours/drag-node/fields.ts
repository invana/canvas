import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DragNodeBehaviour editor. Field `name`s
 * match the keys of `DragNodeFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
export const dragNodeFields: FieldConfig[] = [
  {
    name: 'dragCursor',
    type: 'text',
    label: 'Drag cursor',
    description: 'CSS cursor applied to the canvas while dragging. Default "grabbing".',
  },
  {
    name: 'groupAware',
    type: 'boolean',
    label: 'Group aware',
    description: 'Dragging an expanded group node translates its whole subtree together.',
  },
  {
    name: 'pinOnRelease',
    type: 'boolean',
    label: 'Pin on release',
    description: 'Pin dragged nodes on drop so layouts keep them where the user placed them.',
  },
  {
    name: 'dragSelection',
    type: 'boolean',
    label: 'Drag selection',
    description: 'Grabbing a selected node drags the whole selection together.',
  },
  {
    name: 'selectionState',
    type: 'text',
    label: 'Selection state',
    description: 'Layer visual-state name that marks a node as selected. Default "selected".',
  },
  {
    name: 'selectionBodyDrag',
    type: 'boolean',
    label: 'Selection body drag',
    description: 'Let a press in the empty space inside the selection box grab the whole set.',
  },
  {
    name: 'selectionBodyPadding',
    type: 'number',
    label: 'Selection body padding',
    min: 0,
    step: 1,
    description: 'Extra world-space padding around the selection box for body-drag hit-testing.',
  },
];
