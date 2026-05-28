import {
  HoverActivateBehaviour as EngineHoverActivateBehaviour,
  type HoverActivateBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface HoverActivateBehaviourProps
  extends Omit<HoverActivateBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'hover'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `HoverActivateBehaviour`.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function HoverActivateBehaviour({
  id = 'hover',
  layerId = 'graph',
  enabled = true,
  ...rest
}: HoverActivateBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineHoverActivateBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
