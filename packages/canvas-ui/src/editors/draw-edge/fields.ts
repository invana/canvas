import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DrawEdgeBehaviour editor. Field `name`s
 * match the keys of {@link import('./types').DrawEdgeFields} 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`. The nested
 * `draftStyle` group is rendered as flat `draft`-prefixed scalars; its dash
 * tuple is two number inputs.
 */
export const drawEdgeFields: FieldConfig[] = [
  {
    name: 'allowSelfLoop',
    type: 'boolean',
    label: 'Allow self-loops',
    description: 'Releasing on the source node creates a loop edge instead of cancelling.',
  },
  {
    name: 'draftColor',
    type: 'color',
    label: 'Preview colour',
    description: 'Stroke colour of the rubber-band preview while drawing. Default light blue.',
  },
  {
    name: 'draftWidth',
    type: 'number',
    label: 'Preview width',
    min: 0,
    step: 0.5,
    description: 'Line width of the preview stroke. Default 2.',
  },
  {
    name: 'draftAlpha',
    type: 'number',
    label: 'Preview opacity',
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Opacity of the preview stroke. Default 0.9.',
  },
  {
    name: 'draftDashLength',
    type: 'number',
    label: 'Dash length',
    min: 0,
    step: 1,
    description: 'Length of each dash in the preview. Default 6.',
  },
  {
    name: 'draftDashGap',
    type: 'number',
    label: 'Dash gap',
    min: 0,
    step: 1,
    description: 'Gap between dashes in the preview. Default 4.',
  },
];
