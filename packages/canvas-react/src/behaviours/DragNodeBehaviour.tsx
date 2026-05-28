import {
  DragNodeBehaviour as EngineDragNodeBehaviour,
  type DragNodeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DragNodeBehaviourProps extends Omit<DragNodeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'drag-node'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes this behaviour drags; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DragNodeBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` / `layerId` (or the `key`) to recreate.
 */
export function DragNodeBehaviour({
  id = 'drag-node',
  layerId = 'graph',
  enabled = true,
  ...rest
}: DragNodeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineDragNodeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
