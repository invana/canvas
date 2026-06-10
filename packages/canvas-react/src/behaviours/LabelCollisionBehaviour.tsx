import * as graph from '@invana/graph';
import {
  type LabelCollisionBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface LabelCollisionBehaviourProps
  extends Omit<LabelCollisionBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'label-collision'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `LabelCollisionBehaviour`
 * (hide/show overlapping labels by priority).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function LabelCollisionBehaviour({
  id = 'label-collision',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: LabelCollisionBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.LabelCollisionBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
