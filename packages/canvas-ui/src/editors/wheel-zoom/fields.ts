import type { FieldConfig } from '@invana/forms';

import type { WheelZoomFields } from './types';

/**
 * `@invana/forms` field schema for the WheelZoomBehaviour editor. Field `name`s
 * match the keys of {@link WheelZoomFields} 1:1 so the generator's
 * `options.<name>` paths line up with `mapping.ts`.
 *
 * A function of the live values (like `nodeStyleFields`): the `smoothFrames`
 * input only appears while `smooth` is on — the form-generator's way of handling
 * the engine's `smooth: false | number` union.
 */
export function wheelZoomFields(values: WheelZoomFields = {}): FieldConfig[] {
  return [
    {
      name: 'requireCtrl',
      type: 'boolean',
      label: 'Require Ctrl',
      description: 'Only Ctrl+scroll zooms; plain scroll falls through to the page.',
    },
    {
      name: 'percent',
      type: 'number',
      label: 'Zoom speed',
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Zoom fraction per wheel tick. Default 0.1 (10%).',
    },
    {
      name: 'smooth',
      type: 'boolean',
      label: 'Smooth scroll',
      description: 'Ease-out zoom instead of an instant snap.',
    },
    ...(values.smooth
      ? [
          {
            name: 'smoothFrames',
            type: 'number',
            label: 'Ease frames',
            min: 1,
            max: 60,
            step: 1,
            description: 'Frame count for the ease-out. Higher = slower glide.',
          } as FieldConfig,
        ]
      : []),
  ];
}
