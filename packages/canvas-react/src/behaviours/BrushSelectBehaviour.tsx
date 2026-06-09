import {
  BrushSelectBehaviour as EngineBrushSelectBehaviour,
  type BrushSelectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface BrushSelectBehaviourProps
  extends Omit<BrushSelectBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'brush-select'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `BrushSelectBehaviour`
 * (rectangular rubber-band selection).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function BrushSelectBehaviour({
  id = 'brush-select',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: BrushSelectBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineBrushSelectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
