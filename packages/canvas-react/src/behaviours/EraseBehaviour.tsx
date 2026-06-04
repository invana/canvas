import {
  EraseBehaviour as EngineEraseBehaviour,
  type EraseBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EraseBehaviourProps extends Omit<EraseBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'erase'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour erases from; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EraseBehaviour` — click a node
 * (cascades its edges) or an edge to delete it.
 *
 * `enabled` is reactive (toggle it from a tool-mode switch); other options are
 * init-only — change `id` / `layerId` (or the `key`) to recreate. Pair `onErase`
 * with `useDrawHistory().onErase` to make deletes undoable.
 */
export function EraseBehaviour({
  id = 'erase',
  layerId = 'graph',
  enabled = true,
  ...rest
}: EraseBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineEraseBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
