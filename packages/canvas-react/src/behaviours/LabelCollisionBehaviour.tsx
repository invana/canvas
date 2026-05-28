import {
  LabelCollisionBehaviour as EngineLabelCollisionBehaviour,
  type LabelCollisionBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface LabelCollisionBehaviourProps
  extends Omit<LabelCollisionBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'label-collision'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `LabelCollisionBehaviour`
 * (hide/show overlapping labels by priority).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function LabelCollisionBehaviour({
  id = 'label-collision',
  layerId = 'graph',
  enabled = true,
  ...rest
}: LabelCollisionBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineLabelCollisionBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
