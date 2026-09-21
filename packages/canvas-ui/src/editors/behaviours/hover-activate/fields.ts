import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the HoverActivateBehaviour editor. Field
 * `name`s match the keys of `HoverActivateFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
export const hoverActivateFields: FieldConfig[] = [
  {
    name: 'hoverEdges',
    type: 'boolean',
    label: 'Hover edges',
    description:
      'Whether hovering directly over an edge activates it. Off = nodes only (a hovered node’s connecting edges still light up via degree).',
  },
  {
    name: 'excludeNodeTypes',
    type: 'text',
    label: 'Exclude node types',
    description:
      'Comma-separated node types that never become the focal hover — scenery such as group frames. Neighbour highlighting is unaffected.',
  },
  {
    name: 'excludeGroups',
    type: 'select',
    label: 'Exclude groups',
    description:
      'Which group frames never become the focal hover, by what they are rather than by type. "Expanded" (the default) makes an open frame scenery and leaves a collapsed one interactive.',
    options: [
      { value: 'expanded', label: 'Expanded frames' },
      { value: 'always', label: 'Every frame' },
      { value: 'never', label: 'Never — frames hover' },
    ],
  },
  {
    name: 'excludeEdgeTypes',
    type: 'text',
    label: 'Exclude edge types',
    description:
      'Comma-separated edge types that never become the focal hover. Only bites when "Hover edges" is on.',
  },
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
