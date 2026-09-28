import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the FocusBehaviour editor. Field `name`s
 * match the keys of `FocusFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`. Static — no input depends on another's value.
 */
export const focusFields: FieldConfig[] = [
  {
    name: 'focusState',
    type: 'text',
    label: 'Focus state',
    description: 'Runtime state written on focused nodes (and the edges between them). Default "highlighted".',
  },
  {
    name: 'dimState',
    type: 'text',
    label: 'Dim state',
    description: 'State written on everything else when the focus dims. Default "dimmed"; blank never dims.',
  },
  {
    name: 'includeEdges',
    type: 'boolean',
    label: 'Emphasise edges',
    description: 'Also emphasise edges whose two endpoints are focused.',
  },
  {
    name: 'frame',
    type: 'boolean',
    label: 'Frame on focus',
    description: 'Frame the focused nodes after every focus change. Off: only a "focus" camera intent frames.',
  },
  {
    name: 'framePadding',
    type: 'number',
    label: 'Frame padding',
    min: 0,
    step: 4,
    description: 'Screen-px margin around the framed nodes. Default 80.',
  },
  {
    name: 'frameDurationMs',
    type: 'number',
    label: 'Frame duration (ms)',
    min: 0,
    step: 50,
    description: 'Length of the framing glide. 0 snaps. Default 450.',
  },
  {
    name: 'frameMaxZoom',
    type: 'number',
    label: 'Max frame zoom',
    min: 0.1,
    step: 0.1,
    description: 'Never zoom in past this when framing. Default 2.',
  },
];
