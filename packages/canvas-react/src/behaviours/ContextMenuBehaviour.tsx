import {
  ContextMenuBehaviour as EngineContextMenuBehaviour,
  type ContextMenuBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ContextMenuBehaviourProps
  extends Omit<ContextMenuBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'context-menu'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes/edges this behaviour watches; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ContextMenuBehaviour`.
 *
 * Headless — pass `onContextMenu` to receive node/edge/canvas right-click
 * events and render your own menu. `enabled` is reactive (toggles in place);
 * other options are init-only — change `id` / `targetLayerId` (or the `key`) to
 * recreate.
 */
export function ContextMenuBehaviour({
  id = 'context-menu',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ContextMenuBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineContextMenuBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
