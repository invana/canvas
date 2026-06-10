import { useCallback, useState } from 'react';
import type { Canvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

const DEFAULT_LOCK_IDS = ['pan', 'drag-node'];

export interface UseLockOptions {
  /**
   * Behaviour ids disabled while locked (re-enabled on unlock). Default
   * `['pan', 'drag-node']` — pan + node drag, leaving zoom available.
   */
  behaviourIds?: string[];
  /** Initial locked state. Default `false`. */
  initialLocked?: boolean;
}

export interface UseLockResult {
  locked: boolean;
  toggleLock: () => void;
  setLock: (locked: boolean) => void;
}

/**
 * View lock — disables a configurable set of behaviours (pan + node drag by
 * default) while keeping zoom available. "Lock" is app policy, not an engine
 * concept, so which behaviours it disables is configurable. State is owned by
 * the hook.
 */
export function useLock(
  options: UseLockOptions = {},
  canvas?: Canvas | null,
): UseLockResult {
  const { behaviourIds = DEFAULT_LOCK_IDS, initialLocked = false } = options;
  const resolved = useResolvedCanvas(canvas);
  const [locked, setLocked] = useState(initialLocked);

  const setLock = useCallback(
    (next: boolean) => {
      for (const id of behaviourIds) {
        const behaviour = resolved.behaviours.get(id);
        if (!behaviour) continue;
        if (next) behaviour.disable();
        else behaviour.enable();
      }
      setLocked(next);
    },
    [resolved, behaviourIds],
  );

  const toggleLock = useCallback(() => setLock(!locked), [setLock, locked]);

  return { locked, toggleLock, setLock };
}
