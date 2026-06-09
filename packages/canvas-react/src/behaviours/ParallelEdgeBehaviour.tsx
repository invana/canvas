import {
  ParallelEdgeBehaviour as EngineParallelEdgeBehaviour,
  type ParallelEdgeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ParallelEdgeBehaviourProps
  extends Omit<ParallelEdgeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'parallel-edge'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ParallelEdgeBehaviour`
 * (fan out edges that share the same source/target pair).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function ParallelEdgeBehaviour({
  id = 'parallel-edge',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ParallelEdgeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineParallelEdgeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
