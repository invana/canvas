import * as graph from '@invana/graph';
import { type EntranceBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface EntranceBehaviourProps
  extends Omit<EntranceBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'entrance'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour animates; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `EntranceBehaviour` — the graph
 * *arrives* (a short staggered fade) instead of cutting from blank to complete.
 *
 * Plays once, when the active layout reports a settled run (or on first data
 * when there is no layout), then retires the effects it wrote. Re-layouts and
 * data updates never replay it; remount the component (change `id`, or its
 * React `key`) to see it again.
 *
 * `enabled` is reactive; other options are init-only — change `id` /
 * `targetLayerId`.
 *
 * @example
 * ```tsx
 * <GraphCanvas config={CONFIG}>
 *   <GraphLayer id="graph" data={DATA} />
 *   <EntranceBehaviour staggerMs={28} order="x" />
 * </GraphCanvas>
 * ```
 */
export function EntranceBehaviour({
  id = 'entrance',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: EntranceBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.EntranceBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
