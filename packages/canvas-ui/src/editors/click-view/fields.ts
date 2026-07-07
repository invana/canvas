import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ClickViewBehaviour editor. Field `name`s
 * match the keys of `ClickViewFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`.
 */
export const clickViewFields: FieldConfig[] = [
  {
    name: 'clearOnBackground',
    type: 'boolean',
    label: 'Clear on background',
    description: 'Clear the viewed element when clicking the empty canvas background.',
  },
];
