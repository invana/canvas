import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ClickInspectBehaviour editor. Field
 * `name`s match the keys of `ClickInspectFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 */
export const clickInspectFields: FieldConfig[] = [
  {
    name: 'clearOnBackground',
    type: 'boolean',
    label: 'Clear on background',
    description: 'Clear the inspected element when clicking the empty canvas background.',
  },
];
