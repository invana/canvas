import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the NodeResizeBehaviour editor. Field `name`s
 * match the keys of `NodeResizeFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`. The engine's `dashArray` tuple is exposed as
 * two number fields; colours are `color` swatches.
 */
export const nodeResizeFields: FieldConfig[] = [
  {
    name: 'handleRadius',
    type: 'number',
    label: 'Handle radius',
    min: 1,
    step: 1,
    description: 'Resize-handle outer radius in px. Default 5.',
  },
  {
    name: 'handleFill',
    type: 'color',
    label: 'Handle fill',
    description: 'Fill colour of the round resize handles. Default white.',
  },
  {
    name: 'frameColor',
    type: 'color',
    label: 'Frame colour',
    description: 'Colour of the dashed frame border + handle outlines. Default blue.',
  },
  {
    name: 'dashLength',
    type: 'number',
    label: 'Dash length',
    min: 0,
    step: 1,
    description: 'Dash segment length of the frame border in px. Default 5.',
  },
  {
    name: 'dashGap',
    type: 'number',
    label: 'Dash gap',
    min: 0,
    step: 1,
    description: 'Gap between dash segments of the frame border in px. Default 4.',
  },
  {
    name: 'framePadding',
    type: 'number',
    label: 'Frame padding',
    min: 0,
    step: 1,
    description: 'Gap between the host silhouette and the dashed frame. Default 4.',
  },
  {
    name: 'minSize',
    type: 'number',
    label: 'Minimum size',
    min: 1,
    step: 1,
    description: 'Smallest width / height / radius allowed during a resize drag. Default 20.',
  },
];
