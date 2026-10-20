import * as graph from '@invana/graph';
import { type UnsavedChangesBehaviourOptions } from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface UnsavedChangesBehaviourProps extends Omit<UnsavedChangesBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'unsaved-changes'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose changes are tracked; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `UnsavedChangesBehaviour` — marks what
 * is new, edited and deleted since the host last saved. Read it with
 * `useUnsavedChanges`; draw deletions with `<UnsavedGhostLayer>`.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function UnsavedChangesBehaviour({
  id = 'unsaved-changes',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: UnsavedChangesBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.UnsavedChangesBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
