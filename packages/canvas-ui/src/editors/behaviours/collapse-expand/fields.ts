import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the CollapseExpandBehaviour editor.
 *
 * `doubleClickToToggle`, `centerOnToggle` and `centerDurationMs` are the
 * editable visualisation state — the rest of `CollapseExpandBehaviourOptions` is base wiring
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
      'Pan the camera to centre a frame after it opens or closes. Off by default — the camera stays put. Zoom is left alone.',
  },
  {
    name: 'centerDurationMs',
    type: 'number',
    label: 'Centre glide (ms)',
    description:
      'How long the re-centre pan glides for. 0 jumps straight to the frame. A pan or zoom during the glide cancels it.',
    min: 0,
    max: 1000,
    step: 50,
  },
];
