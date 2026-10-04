import * as graph from '@invana/graph';
import { type EdgeLabelLODBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EdgeLabelLODBehaviourProps
  extends Omit<EdgeLabelLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'edge-label-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EdgeLabelLODBehaviour` — edge labels
 * across camera zoom: a show / hide band and an on-screen size policy
 * (`zoomGrowth` / `minFontPx` / `maxFontPx`), tuned separately from node labels.
 *
 * `enabled` is reactive; the band and size options are init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply new ones, or retune
 * live through the canvas (`canvas.update({ behaviours: { [id]: … } })`).
 */
export function EdgeLabelLODBehaviour({
  id = 'edge-label-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: EdgeLabelLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.EdgeLabelLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
