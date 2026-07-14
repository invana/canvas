import * as graph from '@invana/graph';
import { type TextLODBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface TextLODBehaviourProps
  extends Omit<TextLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'text-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `TextLODBehaviour`
 * (show / hide node text — labels + composite internal text — by camera zoom band).
 *
 * `enabled` is reactive; the `minZoom` / `maxZoom` band is init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply a new band, or drive
 * it live through the engine's `setOptions`.
 */
export function TextLODBehaviour({
  id = 'text-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: TextLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.TextLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
