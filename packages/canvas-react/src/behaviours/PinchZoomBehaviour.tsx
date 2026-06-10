import * as canvas from '@invana/canvas';
import {
  type PinchZoomBehaviourOptions,
} from '@invana/canvas';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface PinchZoomBehaviourProps extends Omit<PinchZoomBehaviourOptions, 'id'> {
  /** Behaviour id; default `'pinch'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `PinchZoomBehaviour`
 * (two-finger / trackpad pinch zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `key`.
 */
export function PinchZoomBehaviour({
  id = 'pinch',
  enabled = true,
  ...rest
}: PinchZoomBehaviourProps) {
  useBehaviourRegistration(
    () => new canvas.PinchZoomBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id],
  );
  return null;
}
