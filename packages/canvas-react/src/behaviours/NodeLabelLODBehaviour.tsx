import * as graph from '@invana/graph';
import { type NodeLabelLODBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface NodeLabelLODBehaviourProps
  extends Omit<NodeLabelLODBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'node-label-lod'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour drives; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `NodeLabelLODBehaviour` — node labels
 * across camera zoom: a show / hide band (labels + composite internal text) and
 * an on-screen size policy (`zoomGrowth` / `minFontPx` / `maxFontPx`).
 *
 * `enabled` is reactive; the band and size options are init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply new ones, or retune
 * live through the canvas (`canvas.update({ behaviours: { [id]: … } })`).
 */
export function NodeLabelLODBehaviour({
  id = 'node-label-lod',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: NodeLabelLODBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.NodeLabelLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
