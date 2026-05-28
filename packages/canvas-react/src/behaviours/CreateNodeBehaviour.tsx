import {
  CreateNodeBehaviour as EngineCreateNodeBehaviour,
  type CreateNodeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface CreateNodeBehaviourProps
  extends Omit<CreateNodeBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'create-node'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour adds nodes to; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `CreateNodeBehaviour` — click empty
 * canvas to add a node.
 *
 * `enabled` is reactive (toggle it from a tool-mode switch); other options are
 * init-only — change `id` / `layerId` (or the `key`) to recreate.
 */
export function CreateNodeBehaviour({
  id = 'create-node',
  layerId = 'graph',
  enabled = true,
  ...rest
}: CreateNodeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineCreateNodeBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
