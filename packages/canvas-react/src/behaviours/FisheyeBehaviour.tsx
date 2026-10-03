import * as graph from '@invana/graph';
import { type FisheyeBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface FisheyeBehaviourProps
  extends Omit<FisheyeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'fisheye'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id the lens distorts; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `FisheyeBehaviour` — a focus+context
 * magnifier lens (nodes under the lens drawn spread apart, enlarged and
 * labelled; display-only, never written to the store).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`,
 * or retune live through the canvas (`canvas.update({ behaviours: { fisheye: … } })`).
 */
export function FisheyeBehaviour({
  id = 'fisheye',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: FisheyeBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.FisheyeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
