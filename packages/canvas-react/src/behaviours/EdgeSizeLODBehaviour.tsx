import {
  EdgeSizeLODBehaviour as EngineEdgeSizeLODBehaviour,
  type EdgeSizeLODBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EdgeSizeLODBehaviourProps
  extends Omit<EdgeSizeLODBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'edge-size-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EdgeSizeLODBehaviour`
 * (rescale edge stroke widths per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function EdgeSizeLODBehaviour({
  id = 'edge-size-lod',
  layerId = 'graph',
  enabled = true,
  ...rest
}: EdgeSizeLODBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineEdgeSizeLODBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
