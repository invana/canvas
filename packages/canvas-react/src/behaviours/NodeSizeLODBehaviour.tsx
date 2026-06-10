import * as graph from '@invana/graph';
import {
  type NodeSizeLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeSizeLODBehaviourProps
  extends Omit<NodeSizeLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'node-size-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeSizeLODBehaviour`
 * (rescale node sizes per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function NodeSizeLODBehaviour({
  id = 'node-size-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: NodeSizeLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.NodeSizeLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
