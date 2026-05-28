import {
  NodeSizeLODBehaviour as EngineNodeSizeLODBehaviour,
  type NodeSizeLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeSizeLODBehaviourProps
  extends Omit<NodeSizeLODBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'node-size-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeSizeLODBehaviour`
 * (rescale node sizes per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function NodeSizeLODBehaviour({
  id = 'node-size-lod',
  layerId = 'graph',
  enabled = true,
  ...rest
}: NodeSizeLODBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineNodeSizeLODBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
