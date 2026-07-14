import * as graph from '@invana/graph';
import {
  type EdgeScaleLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EdgeScaleLODBehaviourProps
  extends Omit<EdgeScaleLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'edge-scale-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EdgeScaleLODBehaviour`
 * (rescale edge stroke widths per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function EdgeScaleLODBehaviour({
  id = 'edge-scale-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: EdgeScaleLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.EdgeScaleLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
