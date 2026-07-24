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
    description: 'Hide the content above this camera zoom. Blank = no upper bound.',
  },
];

/**
 * Schema for the **text** LOD editor — the shared band plus `alwaysShowTop`,
 * the top-centrality label exemption (text-only). Pass this as `fields` to
 * {@link ContentLODEditorPanel} when editing a `TextLODBehaviour`.
 */
export const textLODFields: FieldConfig[] = [
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
];
