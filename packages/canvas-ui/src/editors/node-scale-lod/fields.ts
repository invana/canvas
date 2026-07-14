import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the NodeScaleLODBehaviour editor. Field
 * `name`s match the keys of `NodeScaleLODFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 *
 * The per-layer `layers[]` config array (target layer + `sizePx` /
 * `strokeWidthPx`) is intentionally not represented — it's a structural,
 * identity-bearing array with no `FieldType`, edited elsewhere and left
 * untouched by this form.
 */
export const nodeScaleLodFields: FieldConfig[] = [
  {
    name: 'scaleEpsilon',
    type: 'number',
    label: 'Scale epsilon',
    min: 0,
    step: 0.001,
    description: 'Skip apply below this relative zoom delta. Default 0.005.',
  },
  {
    name: 'settleMs',
    type: 'number',
    label: 'Settle (ms)',
    min: 0,
    step: 10,
    description: '0 = per-frame; > 0 debounces the apply after zoom silence.',
  },
];
