import {
  LassoSelectBehaviour as EngineLassoSelectBehaviour,
  type LassoSelectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface LassoSelectBehaviourProps
  extends Omit<LassoSelectBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'lasso-select'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `LassoSelectBehaviour`
 * (freeform polygon selection).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function LassoSelectBehaviour({
  id = 'lasso-select',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: LassoSelectBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineLassoSelectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
