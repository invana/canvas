import * as graph from '@invana/graph';
import {
  type TextResolutionLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface TextResolutionLODBehaviourProps
  extends Omit<TextResolutionLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'label-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `TextResolutionLODBehaviour`
 * (show/hide labels by camera zoom tier).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function TextResolutionLODBehaviour({
  id = 'label-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: TextResolutionLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.TextResolutionLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
