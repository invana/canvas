import * as graph from '@invana/graph';
import {
  type NodeScaleLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeScaleLODBehaviourProps
  extends Omit<NodeScaleLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'node-scale-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeScaleLODBehaviour`
 * (rescale node sizes per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function NodeScaleLODBehaviour({
  id = 'node-scale-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: NodeScaleLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.NodeScaleLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
