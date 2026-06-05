import {
  ClickInspectBehaviour as EngineClickInspectBehaviour,
  type ClickInspectBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ClickInspectBehaviourProps
  extends Omit<ClickInspectBehaviourOptions, 'id' | 'layerId'> {
  /** Behaviour id; default `'click-inspect'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour reads clicks from; default `'graph'`. */
  layerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ClickInspectBehaviour` — tracks the
 * single node/edge clicked for editing, decoupled from selection. Pair with
 * `<InspectorPanel>` (which reads this behaviour's target by id).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `layerId`.
 */
export function ClickInspectBehaviour({
  id = 'click-inspect',
  layerId = 'graph',
  enabled = true,
  ...rest
}: ClickInspectBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineClickInspectBehaviour({ id, layerId, enabled, ...rest }),
    id,
    enabled,
    [id, layerId],
  );
  return null;
}
