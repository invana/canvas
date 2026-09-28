import * as graph from '@invana/graph';
import { type FocusBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface FocusBehaviourProps extends Omit<FocusBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'focus'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour draws on; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `FocusBehaviour` — draws
 * `view.interaction.focus` (emphasise the focused nodes, dim the rest) and
 * frames them on a `'focus'` camera intent.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function FocusBehaviour({ id = 'focus', targetLayerId = 'graph', enabled = true, ...rest }: FocusBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.FocusBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
