import * as graph from '@invana/graph';
import {
  type EraseBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EraseBehaviourProps extends Omit<EraseBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'erase'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour erases from; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EraseBehaviour` — click a node
 * (cascades its edges) or an edge to delete it.
 *
 * `enabled` is reactive (toggle it from a tool-mode switch); other options are
 * init-only — change `id` / `targetLayerId` (or the `key`) to recreate. Pair `onErase`
 * with `useDrawHistory().onErase` to make deletes undoable.
 */
export function EraseBehaviour({
  id = 'erase',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: EraseBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.EraseBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
