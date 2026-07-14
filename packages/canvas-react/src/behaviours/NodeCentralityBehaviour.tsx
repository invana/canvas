import * as graph from '@invana/graph';
import {
  type NodeCentralityBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeCentralityBehaviourProps
  extends Omit<NodeCentralityBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'node-centrality'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeCentralityBehaviour`
 * (size nodes by in/out degree).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function NodeCentralityBehaviour({
  id = 'node-centrality',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: NodeCentralityBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.NodeCentralityBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
