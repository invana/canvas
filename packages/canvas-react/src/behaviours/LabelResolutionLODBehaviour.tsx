import {
  LabelResolutionLODBehaviour as EngineLabelResolutionLODBehaviour,
  type LabelResolutionLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface LabelResolutionLODBehaviourProps
  extends Omit<LabelResolutionLODBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'label-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `LabelResolutionLODBehaviour`
 * (show/hide labels by camera zoom tier).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function LabelResolutionLODBehaviour({
  id = 'label-lod',
  layerId = 'graph',
  enabled = true,
  ...rest
}: LabelResolutionLODBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineLabelResolutionLODBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
