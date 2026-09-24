import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the CollapseExpandBehaviour editor.
 *
 * `doubleClickToToggle`, `relayoutOnToggle`, `centerOnToggle`,
 * `centerDurationMs`, `countBadge` and `countBadgePlacement` are the editable
 * visualisation state — the rest of `CollapseExpandBehaviourOptions` is base wiring
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
    name: 'relayoutOnToggle',
    type: 'boolean',
    label: 'Re-layout on toggle',
    description:
      'Re-run the active layout after a frame opens or closes, so neighbours close the gap or make room. The toggled frame stays where it is and the camera is left alone.',
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
  {
    name: 'countBadge',
    type: 'boolean',
    label: 'Count badge',
    description:
      'Mark each collapsed frame with a small pill showing how many nodes it hides. Coloured from the theme; gone when the frame opens.',
  },
  {
    name: 'countBadgePlacement',
    type: 'select',
    label: 'Count badge placement',
    description: 'Which corner or edge of the collapsed frame the count badge sits on, centred on that point.',
    options: [
      { value: 'top-right', label: 'Top right' },
      { value: 'top-left', label: 'Top left' },
      { value: 'bottom-right', label: 'Bottom right' },
      { value: 'bottom-left', label: 'Bottom left' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ],
  },
];
