import {
  DrawEdgeBehaviour as EngineDrawEdgeBehaviour,
  type DrawEdgeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DrawEdgeBehaviourProps extends Omit<DrawEdgeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'draw-edge'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour draws edges in; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DrawEdgeBehaviour` — drag from a
 * source node to a target node to create an edge (rubber-band preview).
 *
 * `enabled` is reactive (toggle it from a tool-mode switch). Don't enable this
 * and `DragNodeBehaviour` at once — both start on node pointer-down. Other
 * options are init-only — change `id` / `targetLayerId` (or the `key`) to recreate.
 */
export function DrawEdgeBehaviour({
  id = 'draw-edge',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: DrawEdgeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineDrawEdgeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
