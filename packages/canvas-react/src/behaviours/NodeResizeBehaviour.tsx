import {
  NodeResizeBehaviour as EngineNodeResizeBehaviour,
  type NodeResizeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeResizeBehaviourProps
  extends Omit<NodeResizeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'node-resize'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeResizeBehaviour`
 * (drag corner handles to resize a node).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function NodeResizeBehaviour({
  id = 'node-resize',
  layerId = 'graph',
  enabled = true,
  ...rest
}: NodeResizeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineNodeResizeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
