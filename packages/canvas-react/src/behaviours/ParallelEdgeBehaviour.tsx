import {
  ParallelEdgeBehaviour as EngineParallelEdgeBehaviour,
  type ParallelEdgeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ParallelEdgeBehaviourProps
  extends Omit<ParallelEdgeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'parallel-edge'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ParallelEdgeBehaviour`
 * (fan out edges that share the same source/target pair).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function ParallelEdgeBehaviour({
  id = 'parallel-edge',
  layerId = 'graph',
  enabled = true,
  ...rest
}: ParallelEdgeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineParallelEdgeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
