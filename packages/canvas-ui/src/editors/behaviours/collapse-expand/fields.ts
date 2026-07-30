import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the CollapseExpandBehaviour editor.
 *
 * `doubleClickToToggle` and `centerOnToggle` are the editable visualisation
 * state — the rest of `CollapseExpandBehaviourOptions` is base wiring
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`), which the settings editor
 * doesn't own.
 */
export const collapseExpandFields: FieldConfig[] = [
  {
    name: 'doubleClickToToggle',
    type: 'boolean',
    label: 'Double-click to toggle',
    description:
      'Double-clicking a group frame opens or closes it, alongside its +/− button. A double-click that lands on a member node is left to that node.',
  },
  {
    name: 'centerOnToggle',
    type: 'boolean',
    label: 'Centre on toggle',
    description:
      'Pan the camera to centre a frame after it opens or closes, so it stays under the eye as it changes size. Zoom is left alone.',
  },
];
