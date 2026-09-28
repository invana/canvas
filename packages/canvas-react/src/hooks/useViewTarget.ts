import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ClickViewBehaviour, ViewTarget } from '@invana/graph';

import { useBehaviourInstance } from './useBehaviourInstance';

export interface UseViewTargetOptions {
  /** Id of the `ClickViewBehaviour` to read the target from. Default `'click-view'`. */
  viewId?: string;
}

/**
 * Reactive view of the single node/edge currently targeted for **read-only
 * property viewing**, driven by a `ClickViewBehaviour`'s `view:change` event.
 * Returns `null` when no element is targeted (or the behaviour isn't
 * registered).
 *
 * The read-only counterpart of {@link useInspectTarget}: that one feeds an
 * editor (`ClickInspectBehaviour`), this one feeds a viewer
 * (`ClickViewBehaviour`). Both are distinct from {@link useSelection} (which can
 * hold many elements) — this is always the *one* element a viewer should show.
 */
export function useViewTarget(
  options: UseViewTargetOptions = {},
  canvas?: Canvas | null,
): ViewTarget | null {
  const { viewId = 'click-view' } = options;
  const behaviour = useBehaviourInstance<ClickViewBehaviour>(viewId, canvas);
  const [target, setTarget] = useState<ViewTarget | null>(null);

  // `useBehaviourInstance` follows late registration (the viewer UI nested inside
  // the `<ClickViewBehaviour>` wrapper, whose effect runs after this child's),
  // removal, and re-registration under the same id.
  useEffect(() => {
    setTarget(behaviour?.getTarget() ?? null);
    if (!behaviour) return;
    return behaviour.events.on('view:change', setTarget);
  }, [behaviour]);

  return target;
}
