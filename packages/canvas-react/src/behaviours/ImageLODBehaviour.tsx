import * as graph from '@invana/graph';
import { type ImageLODBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ImageLODBehaviourProps
  extends Omit<ImageLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'image-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ImageLODBehaviour`
 * (show / hide node silhouette image fills by camera zoom band).
 *
 * `enabled` is reactive; the `minZoom` / `maxZoom` band is init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply a new band, or drive
 * it live through the engine's `setOptions`.
 */
export function ImageLODBehaviour({
  id = 'image-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ImageLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ImageLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
