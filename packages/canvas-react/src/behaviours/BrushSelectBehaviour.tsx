import {
  BrushSelectBehaviour as EngineBrushSelectBehaviour,
  type BrushSelectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface BrushSelectBehaviourProps
  extends Omit<BrushSelectBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'brush-select'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `BrushSelectBehaviour`
 * (rectangular rubber-band selection).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function BrushSelectBehaviour({
  id = 'brush-select',
  layerId = 'graph',
  enabled = true,
  ...rest
}: BrushSelectBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineBrushSelectBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
