import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the HoverActivateBehaviour editor. Field
 * `name`s match the keys of `HoverActivateFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
export const hoverActivateFields: FieldConfig[] = [
  {
    name: 'state',
    type: 'text',
    label: 'Active state',
    description: 'State name applied to the hovered element (and neighbours). Default "hovered".',
  },
  {
    name: 'inactiveState',
    type: 'text',
    label: 'Inactive state',
    description: 'State applied to everything NOT in the active set (e.g. "dimmed"). Blank to skip.',
  },
  {
    name: 'raiseActive',
    type: 'boolean',
    label: 'Raise active',
    description: 'Lift the hovered set above its peers so unrelated data does not paint over it.',
  },
  {
    name: 'degree',
    type: 'number',
    label: 'Neighbour degree',
    min: 0,
    max: 6,
    step: 1,
    description: 'N-hop neighbour radius. 0 = hovered element only; 1 = direct neighbours; N = N-hop.',
  },
  {
    name: 'direction',
    type: 'select',
    label: 'Direction',
    options: [
      { label: 'Both', value: 'both' },
      { label: 'In', value: 'in' },
      { label: 'Out', value: 'out' },
    ],
    description: 'Edge-traversal direction used when expanding neighbours.',
  },
  {
    name: 'zoomThreshold',
    type: 'number',
    label: 'Zoom threshold',
    min: 0,
    step: 0.01,
    description: 'Camera scale at/below which the zoomed-out states + scale kick in. Blank disables.',
  },
  {
    name: 'zoomedOutState',
    type: 'text',
    label: 'Zoomed-out node state',
    description: 'State applied to hovered nodes below the zoom threshold. Falls back to Active state.',
  },
  {
    name: 'zoomedOutEdgeState',
    type: 'text',
    label: 'Zoomed-out edge state',
    description: 'State applied to connecting edges below the zoom threshold. Falls back to Active state.',
  },
  {
    name: 'zoomedOutScale',
    type: 'number',
    label: 'Zoomed-out scale',
    min: 1,
    step: 0.1,
    description: 'Gfx-transform multiplier grown on hovered nodes below the threshold. 1 disables.',
  },
];
