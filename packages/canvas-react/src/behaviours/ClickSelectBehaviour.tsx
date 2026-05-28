import {
  ClickSelectBehaviour as EngineClickSelectBehaviour,
  type ClickSelectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ClickSelectBehaviourProps
  extends Omit<ClickSelectBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'click-select'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ClickSelectBehaviour`.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function ClickSelectBehaviour({
  id = 'click-select',
  layerId = 'graph',
  enabled = true,
  ...rest
}: ClickSelectBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineClickSelectBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
