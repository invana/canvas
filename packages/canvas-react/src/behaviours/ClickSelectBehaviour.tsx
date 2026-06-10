import * as graph from '@invana/graph';
import {
  type ClickSelectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ClickSelectBehaviourProps
  extends Omit<ClickSelectBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'click-select'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ClickSelectBehaviour`.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function ClickSelectBehaviour({
  id = 'click-select',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ClickSelectBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ClickSelectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
