import {
  NodeResizeBehaviour as EngineNodeResizeBehaviour,
  type NodeResizeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeResizeBehaviourProps
  extends Omit<NodeResizeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'node-resize'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeResizeBehaviour`
 * (drag corner handles to resize a node).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function NodeResizeBehaviour({
  id = 'node-resize',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: NodeResizeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineNodeResizeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
