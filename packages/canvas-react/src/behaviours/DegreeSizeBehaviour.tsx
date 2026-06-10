import * as graph from '@invana/graph';
import {
  type DegreeSizeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DegreeSizeBehaviourProps
  extends Omit<DegreeSizeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'degree-size'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DegreeSizeBehaviour`
 * (size nodes by in/out degree).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function DegreeSizeBehaviour({
  id = 'degree-size',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: DegreeSizeBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.DegreeSizeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
