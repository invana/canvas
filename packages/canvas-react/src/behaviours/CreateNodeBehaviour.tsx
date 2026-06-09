import {
  CreateNodeBehaviour as EngineCreateNodeBehaviour,
  type CreateNodeBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface CreateNodeBehaviourProps
  extends Omit<CreateNodeBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'create-node'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour adds nodes to; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `CreateNodeBehaviour` — click empty
 * canvas to add a node.
 *
 * `enabled` is reactive (toggle it from a tool-mode switch); other options are
 * init-only — change `id` / `targetLayerId` (or the `key`) to recreate.
 */
export function CreateNodeBehaviour({
  id = 'create-node',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: CreateNodeBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineCreateNodeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
