import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the KeyboardCameraInputBehaviour editor.
 * Field `name`s match the keys of `KeyboardCameraFields` 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`. The `keymap` object is not
 * surfaced here (too structural for a flat form).
 */
export const keyboardCameraFields: FieldConfig[] = [
  {
    name: 'panStep',
    type: 'number',
    label: 'Pan step',
    min: 1,
    step: 1,
    description: 'Pan distance per key press, in screen pixels. Default 40.',
  },
  {
    name: 'zoomFactor',
    type: 'number',
    label: 'Zoom factor',
    min: 1,
    step: 0.05,
    description: 'Zoom multiplier per key press. 1.1 = 10% in/out. Default 1.1.',
  },
];
