import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ClickSelectBehaviour editor. Field
 * `name`s match the keys of `ClickSelectFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
export const clickSelectFields: FieldConfig[] = [
  {
    name: 'multiple',
    type: 'boolean',
    label: 'Multi-select',
    description: 'A qualifying click toggles membership instead of replacing the selection.',
  },
  {
    name: 'trigger',
    type: 'select',
    label: 'Modifier gate',
    description: 'Modifier required for a click to affect the selection. "None" = every click selects.',
    options: [
      { value: 'none', label: 'None' },
      { value: 'shift', label: 'Shift' },
      { value: 'control', label: 'Control' },
      { value: 'alt', label: 'Alt' },
      { value: 'meta', label: 'Meta' },
    ],
  },
  {
    name: 'degree',
    type: 'number',
    label: 'Neighbour degree',
    min: 0,
    max: 10,
    step: 1,
    description: 'N-hop neighbour radius around each clicked seed. 0 = clicked element only.',
  },
  {
    name: 'direction',
    type: 'select',
    label: 'Direction',
    description: 'Edge-traversal direction for neighbour expansion.',
    options: [
      { value: 'both', label: 'Both' },
      { value: 'in', label: 'Incoming' },
      { value: 'out', label: 'Outgoing' },
    ],
  },
  {
    name: 'state',
    type: 'text',
    label: 'Active state',
    description: 'State name applied to selected elements. Default "selected".',
  },
  {
    name: 'unselectedState',
    type: 'text',
    label: 'Unselected state',
    description: 'State applied to every non-selected element (dimming). Empty = no dimming.',
  },
  {
    name: 'raiseActive',
    type: 'boolean',
    label: 'Raise active',
    description: 'Lift the selected set above its peers so nothing paints over it.',
  },
  {
    name: 'clearOnBackground',
    type: 'boolean',
    label: 'Clear on background',
    description: 'Clear the selection when clicking the empty canvas background.',
  },
];
