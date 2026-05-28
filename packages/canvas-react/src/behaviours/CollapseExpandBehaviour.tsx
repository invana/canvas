import {
  CollapseExpandBehaviour as EngineCollapseExpandBehaviour,
  type CollapseExpandBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface CollapseExpandBehaviourProps
  extends Omit<CollapseExpandBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'collapse-expand'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `CollapseExpandBehaviour`
 * (click a group's +/- toggle to collapse/expand).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function CollapseExpandBehaviour({
  id = 'collapse-expand',
  layerId = 'graph',
  enabled = true,
  ...rest
}: CollapseExpandBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineCollapseExpandBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
