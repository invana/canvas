import {
  LassoSelectBehaviour as EngineLassoSelectBehaviour,
  type LassoSelectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface LassoSelectBehaviourProps
  extends Omit<LassoSelectBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'lasso-select'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `LassoSelectBehaviour`
 * (freeform polygon selection).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function LassoSelectBehaviour({
  id = 'lasso-select',
  layerId = 'graph',
  enabled = true,
  ...rest
}: LassoSelectBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineLassoSelectBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
