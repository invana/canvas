import * as graph from '@invana/graph';
import {
  type CollapseExpandBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface CollapseExpandBehaviourProps
  extends Omit<CollapseExpandBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'collapse-expand'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `CollapseExpandBehaviour`
 * (click a group's +/- toggle to collapse/expand).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function CollapseExpandBehaviour({
  id = 'collapse-expand',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: CollapseExpandBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.CollapseExpandBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
