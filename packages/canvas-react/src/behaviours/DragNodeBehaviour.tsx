import * as graph from '@invana/graph';
import {
  type DragNodeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DragNodeBehaviourProps extends Omit<DragNodeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'drag-node'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes this behaviour drags; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DragNodeBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` / `targetLayerId` (or the `key`) to recreate.
 */
export function DragNodeBehaviour({
  id = 'drag-node',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: DragNodeBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.DragNodeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
