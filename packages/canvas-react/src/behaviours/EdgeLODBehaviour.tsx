import * as graph from '@invana/graph';
import { type EdgeLODBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EdgeLODBehaviourProps
  extends Omit<EdgeLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'edge-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EdgeLODBehaviour`
 * (thin edges below a camera-zoom threshold for the zoomed-out hairball).
 *
 * `enabled` is reactive; the thinning options (`minZoom` / `keepFraction` /
 * `keepBy` / `weightKey`) are init-only — change `id` / `targetLayerId` (or the
 * component `key`) to apply new ones, or drive them live via `setOptions`.
 */
export function EdgeLODBehaviour({
  id = 'edge-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: EdgeLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.EdgeLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
