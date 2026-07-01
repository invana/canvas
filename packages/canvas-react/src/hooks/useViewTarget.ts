import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { ClickViewBehaviour, ViewTarget } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

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
  const resolved = useResolvedCanvas(canvas);
  const [target, setTarget] = useState<ViewTarget | null>(null);

  useEffect(() => {
    let offChange: (() => void) | undefined;
    const attach = (): boolean => {
      const behaviour = resolved.behaviours.get<ClickViewBehaviour>(viewId);
      if (!behaviour) return false;
      setTarget(behaviour.getTarget());
      offChange = behaviour.events.on('view:change', setTarget);
      return true;
    };

    if (attach()) return () => offChange?.();

    // The behaviour may register *after* this hook mounts — e.g. when the viewer
    // UI is nested inside the `<ClickViewBehaviour>` wrapper, whose registration
    // effect (a parent) runs after this child's. Attach as soon as it appears.
    setTarget(null);
    const offReg = resolved.events.on('scene:behaviour:register', ({ id }) => {
      if (id === viewId && attach()) offReg();
    });
    return () => {
      offReg();
      offChange?.();
    };
  }, [resolved, viewId]);

  return target;
}
