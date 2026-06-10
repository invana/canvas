import * as canvas from '@invana/canvas';
import {
  type WheelZoomBehaviourOptions,
} from '@invana/canvas';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface WheelZoomBehaviourProps extends Omit<WheelZoomBehaviourOptions, 'id'> {
  /** Behaviour id; default `'zoom'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `WheelZoomBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` or the component `key` to recreate.
 */
export function WheelZoomBehaviour({
  id = 'zoom',
  enabled = true,
  ...rest
}: WheelZoomBehaviourProps) {
  useBehaviourRegistration(
    () => new canvas.WheelZoomBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id],
  );
  return null;
}
