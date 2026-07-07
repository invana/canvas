import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DevInfoLayer editor. Field `name`s match
 * the keys of `DevInfoLayerFields` 1:1 so the generator's `options.<name>` paths
 * line up with `mapping.ts`. The engine's `margin` union is surfaced as the
 * `marginX` / `marginY` pair.
 */
export const devInfoLayerFields: FieldConfig[] = [
  {
    name: 'corner',
    type: 'select',
    label: 'Corner',
    description: 'Which corner the overlay anchors to.',
    options: [
      { label: 'Top left', value: 'top-left' },
      { label: 'Top right', value: 'top-right' },
      { label: 'Bottom left', value: 'bottom-left' },
      { label: 'Bottom right', value: 'bottom-right' },
    ],
  },
  {
    name: 'marginX',
    type: 'number',
    label: 'Margin X',
    min: 0,
    step: 1,
    description: 'Horizontal inset from the corner, in px. Default 10.',
  },
  {
    name: 'marginY',
    type: 'number',
    label: 'Margin Y',
    min: 0,
    step: 1,
    description: 'Vertical inset from the corner, in px. Default 10.',
  },
  {
    name: 'fontSize',
    type: 'number',
    label: 'Font size',
    min: 6,
    max: 32,
    step: 1,
    description: 'Overlay text size in px. Default 11.',
  },
  {
    name: 'opacity',
    type: 'number',
    label: 'Opacity',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Panel opacity 0–1. Default 0.92.',
  },
  {
    name: 'backgroundColor',
    type: 'text',
    label: 'Background colour',
    description: "Overlay background CSS colour. Accepts rgba(). Default 'rgba(10,10,10,0.82)'.",
  },
  {
    name: 'textColor',
    type: 'color',
    label: 'Text colour',
    description: "Overlay text colour. Default '#c8d3e0'.",
  },
  {
    name: 'accentColor',
    type: 'color',
    label: 'Accent colour',
    description: "Header / accent colour. Default '#4fc3f7'.",
  },
];
