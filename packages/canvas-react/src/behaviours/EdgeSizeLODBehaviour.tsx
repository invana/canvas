import {
  EdgeSizeLODBehaviour as EngineEdgeSizeLODBehaviour,
  type EdgeSizeLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EdgeSizeLODBehaviourProps
  extends Omit<EdgeSizeLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'edge-size-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EdgeSizeLODBehaviour`
 * (rescale edge stroke widths per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function EdgeSizeLODBehaviour({
  id = 'edge-size-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: EdgeSizeLODBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineEdgeSizeLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
