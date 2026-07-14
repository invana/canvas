import * as graph from '@invana/graph';
import { type IconLODBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface IconLODBehaviourProps
  extends Omit<IconLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'icon-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `IconLODBehaviour`
 * (show / hide node inset icons by camera zoom band).
 *
 * `enabled` is reactive; the `minZoom` / `maxZoom` band is init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply a new band, or drive
 * it live through the engine's `setOptions`.
 */
export function IconLODBehaviour({
  id = 'icon-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: IconLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.IconLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
