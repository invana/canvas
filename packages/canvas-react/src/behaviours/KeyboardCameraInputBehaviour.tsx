import * as canvas from '@invana/canvas';
import {
  type KeyboardCameraInputBehaviourOptions,
} from '@invana/canvas';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface KeyboardCameraInputBehaviourProps
  extends Omit<KeyboardCameraInputBehaviourOptions, 'id'> {
  /** Behaviour id; default `'keyboard-camera'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `KeyboardCameraInputBehaviour`
 * (arrow-key pan, +/- zoom, 0 reset).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `key`.
 */
export function KeyboardCameraInputBehaviour({
  id = 'keyboard-camera',
  enabled = true,
  ...rest
}: KeyboardCameraInputBehaviourProps) {
  useBehaviourRegistration(
    () => new canvas.KeyboardCameraInputBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id],
  );
  return null;
}
