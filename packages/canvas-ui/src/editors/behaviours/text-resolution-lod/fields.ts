import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the TextResolutionLODBehaviour editor.
 * Field `name`s match the keys of `TextResolutionLODFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`.
 *
 * The discrete `levels[]` tier array is intentionally not represented here —
 * it's a structural array with no `FieldType`, so it's edited elsewhere and
 * left untouched by this form.
 */
export const textResolutionLodFields: FieldConfig[] = [
  {
    name: 'baseResolution',
    type: 'number',
    label: 'Base resolution',
    min: 0,
    step: 0.5,
    description: 'Base DPR multiplied by the active tier. Default devicePixelRatio.',
  },
  {
    name: 'hysteresis',
    type: 'number',
    label: 'Hysteresis',
    min: 0,
    step: 0.05,
    description: 'Zoom margin before dropping down a tier — stops boundary flicker. Default 0.1.',
  },
];
