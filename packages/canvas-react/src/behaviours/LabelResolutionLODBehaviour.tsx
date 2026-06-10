import * as graph from '@invana/graph';
import {
  type LabelResolutionLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface LabelResolutionLODBehaviourProps
  extends Omit<LabelResolutionLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'label-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `LabelResolutionLODBehaviour`
 * (show/hide labels by camera zoom tier).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function LabelResolutionLODBehaviour({
  id = 'label-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: LabelResolutionLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.LabelResolutionLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
