import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ClickInspectBehaviour, InspectTarget } from '@invana/graph';

import { useBehaviourInstance } from './useBehaviourInstance';

export interface UseInspectTargetOptions {
  /** Id of the `ClickInspectBehaviour` to read the target from. Default `'click-inspect'`. */
  inspectId?: string;
}

/**
 * Reactive view of the single node/edge currently targeted for editing, driven
 * by a `ClickInspectBehaviour`'s `inspect:change` event. Returns `null` when no
 * element is targeted (or the behaviour isn't registered).
 *
 * Distinct from {@link useSelection}: selection can hold many elements (for
 * highlighting / multi-drag), whereas this is always the *one* element a
 * property editor should edit. Follows the behaviour through
 * {@link useBehaviourInstance} — late registration, removal, re-registration.
 */
export function useInspectTarget(
  options: UseInspectTargetOptions = {},
  canvas?: Canvas | null,
): InspectTarget | null {
  const { inspectId = 'click-inspect' } = options;
  const behaviour = useBehaviourInstance<ClickInspectBehaviour>(inspectId, canvas);
  const [target, setTarget] = useState<InspectTarget | null>(null);

  useEffect(() => {
    setTarget(behaviour?.getTarget() ?? null);
    if (!behaviour) return;
    return behaviour.events.on('inspect:change', setTarget);
  }, [behaviour]);

  return target;
}
