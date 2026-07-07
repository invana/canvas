import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the HoverElementPreviewBehaviour editor.
 * Field `name`s match the keys of `HoverElementPreviewFields` 1:1 so the
 * generator's `options.<name>` paths line up with `mapping.ts`. Only the scalar
 * timing / placement / interactivity knobs are exposed; the `card` / `cards`
 * templates are authored separately.
 */
export const hoverElementPreviewFields: FieldConfig[] = [
  {
    name: 'openDelay',
    type: 'number',
    label: 'Open delay (ms)',
    min: 0,
    step: 10,
    description: 'Dwell before a hovered element’s card shows. Default 50ms.',
  },
  {
    name: 'closeDelay',
    type: 'number',
    label: 'Close delay (ms)',
    min: 0,
    step: 10,
    description: 'Grace period after the pointer leaves before the card hides. Default 50ms.',
  },
  {
    name: 'placement',
    type: 'select',
    label: 'Placement',
    options: [
      { label: 'Auto', value: 'auto' },
      { label: 'Top', value: 'top' },
      { label: 'Right', value: 'right' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Top-left', value: 'top-left' },
      { label: 'Top-right', value: 'top-right' },
      { label: 'Bottom-left', value: 'bottom-left' },
      { label: 'Bottom-right', value: 'bottom-right' },
    ],
    description: 'Anchor placement hint passed to the card renderer. Default "bottom-right".',
  },
  {
    name: 'interactive',
    type: 'boolean',
    label: 'Interactive',
    description: 'Let the pointer enter the card (select text, click links) without it vanishing.',
  },
];
