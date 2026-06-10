import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ClickInspectBehaviour, InspectTarget } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

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
 * property editor should edit.
 */
export function useInspectTarget(
  options: UseInspectTargetOptions = {},
  canvas?: Canvas | null,
): InspectTarget | null {
  const { inspectId = 'click-inspect' } = options;
  const resolved = useResolvedCanvas(canvas);
  const [target, setTarget] = useState<InspectTarget | null>(null);

  useEffect(() => {
    const behaviour = resolved.behaviours.get<ClickInspectBehaviour>(inspectId);
    if (!behaviour) {
      setTarget(null);
      return;
    }
    setTarget(behaviour.getTarget());
    return behaviour.events.on('inspect:change', setTarget);
  }, [resolved, inspectId]);

  return target;
}
