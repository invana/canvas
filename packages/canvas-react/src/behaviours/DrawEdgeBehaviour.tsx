import {
  DrawEdgeBehaviour as EngineDrawEdgeBehaviour,
  type DrawEdgeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface DrawEdgeBehaviourProps extends Omit<DrawEdgeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'draw-edge'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour draws edges in; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `DrawEdgeBehaviour` — drag from a
 * source node to a target node to create an edge (rubber-band preview).
 *
 * `enabled` is reactive (toggle it from a tool-mode switch). Don't enable this
 * and `DragNodeBehaviour` at once — both start on node pointer-down. Other
 * options are init-only — change `id` / `layerId` (or the `key`) to recreate.
 */
export function DrawEdgeBehaviour({
  id = 'draw-edge',
  layerId = 'graph',
  enabled = true,
  ...rest
}: DrawEdgeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineDrawEdgeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
