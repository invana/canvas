import {
  DegreeSizeBehaviour as EngineDegreeSizeBehaviour,
  type DegreeSizeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DegreeSizeBehaviourProps
  extends Omit<DegreeSizeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'degree-size'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DegreeSizeBehaviour`
 * (size nodes by in/out degree).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function DegreeSizeBehaviour({
  id = 'degree-size',
  layerId = 'graph',
  enabled = true,
  ...rest
}: DegreeSizeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineDegreeSizeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
