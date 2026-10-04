import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema shared by the content-LOD editors — a single
 * `minZoom` / `maxZoom` band. Field `name`s match `ContentLODFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 */
export const contentLODFields: FieldConfig[] = [
  {
    name: 'minZoom',
    type: 'number',
    label: 'Min zoom',
    min: 0,
    step: 0.1,
    description: 'Hide the content below this camera zoom. Blank = no lower bound.',
  },
  {
    name: 'maxZoom',
    type: 'number',
    label: 'Max zoom',
    min: 0,
    step: 0.1,
    description: 'Hide the content above this camera zoom. Blank / 0 = no upper bound.',
  },
];

/**
 * The on-screen label-size knobs shared by the node- and edge-label LOD
 * editors, behind the form-only `sizeLabels` switch: off = label size
 * untouched (no policy), on = the three knobs apply.
 */
export const labelSizeFields: FieldConfig[] = [
  {
    name: 'sizeLabels',
    type: 'boolean',
    label: 'Size labels on zoom',
    description: 'Off = labels keep the size their node gives them. On = the zoom growth and font bounds below apply.',
  },
  {
    name: 'zoomGrowth',
    type: 'number',
    label: 'Zoom growth',
    min: 0,
    max: 1,
    step: 0.05,
    description:
      'How on-screen size follows zoom: 1 = grows with the world, 0.5 = with its square root, 0 = fixed size.',
  },
  {
    name: 'minFontPx',
    type: 'number',
    label: 'Min font (px)',
    min: 0,
    step: 1,
    description: 'Smallest on-screen font size — keeps zoomed-out labels readable. Blank / 0 = no floor.',
  },
  {
    name: 'maxFontPx',
    type: 'number',
    label: 'Max font (px)',
    min: 0,
    step: 1,
    description: 'Largest on-screen font size — stops labels ballooning when zoomed in. Blank / 0 = no cap.',
  },
];

/**
 * Schema for the **node-label** LOD editor — the shared band, `alwaysShowTop`
 * (the top-centrality exemption) and the label-size knobs. Pass this as
 * `fields` to {@link ContentLODEditorPanel} when editing a `NodeLabelLODBehaviour`.
 */
export const nodeLabelLODFields: FieldConfig[] = [
  ...contentLODFields,
  {
    name: 'alwaysShowTop',
    type: 'number',
    label: 'Always-show top (fraction)',
    min: 0,
    max: 1,
    step: 0.01,
    description:
      'Keep labels shown for the most central nodes even below the band — a fraction by degree (0.05 = top 5%). Relative, so it adapts across graphs. Blank / 0 = off.',
  },
  ...labelSizeFields,
];

/**
 * Schema for the **edge-label** LOD editor — the shared band and the
 * label-size knobs. Pass this as `fields` to {@link ContentLODEditorPanel} when
 * editing an `EdgeLabelLODBehaviour`.
 */
export const edgeLabelLODFields: FieldConfig[] = [...contentLODFields, ...labelSizeFields];
