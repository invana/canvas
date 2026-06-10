import * as graph from '@invana/graph';
import {
  type ClickInspectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ClickInspectBehaviourProps
  extends Omit<ClickInspectBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'click-inspect'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour reads clicks from; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ClickInspectBehaviour` — tracks the
 * single node/edge clicked for editing, decoupled from selection. Pair with
 * `<InspectorPanel>` (which reads this behaviour's target by id).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function ClickInspectBehaviour({
  id = 'click-inspect',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ClickInspectBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ClickInspectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return null;
}
