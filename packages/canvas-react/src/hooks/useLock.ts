import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { isViewLocked, setViewLocked, type Canvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseLockOptions {
  /**
   * Behaviour ids disabled while locked (re-enabled on unlock). Default
   * `['pan', 'drag-node']` — pan + node drag, leaving zoom available.
   */
  behaviourIds?: string[];
  /** Lock the view once on mount. Default `false`. */
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
 * concept, so which behaviours it disables is configurable.
 *
 * The rule is `@invana/canvas`'s `isViewLocked` / `setViewLocked` — the same
 * functions the `view.lock` command calls — so this hook and a saved
 * `view.lock` control always agree. `locked` is read from the behaviours
 * (locked ⇔ every registered target is disabled) and follows any writer;
 * writes go through the behaviour registry, so `scene:behaviour:*` events fire.
 * `initialLocked: true` locks the view once on mount.
 */
export function useLock(
  options: UseLockOptions = {},
  canvas?: Canvas | null,
): UseLockResult {
  const { behaviourIds, initialLocked = false } = options;
  const resolved = useResolvedCanvas(canvas);
  // Read through a ref: a fresh `behaviourIds` array each render must not
  // re-subscribe or re-create the callbacks.
  const idsRef = useRef(behaviourIds);
  idsRef.current = behaviourIds;

  const subscribe = useCallback(
    (onChange: () => void) => {
      // Behaviour events, plus view-store writes: `canvas.update` can flip
      // `enabled` through a behaviour's own `setOptions`, which emits no event.
      const offs = [
        resolved.store.view.subscribe(onChange),
        resolved.events.on('scene:behaviour:enable', onChange),
        resolved.events.on('scene:behaviour:disable', onChange),
        resolved.events.on('scene:behaviour:register', onChange),
        resolved.events.on('scene:behaviour:unregister', onChange),
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved],
  );
  const read = useCallback(() => isViewLocked(resolved, idsRef.current), [resolved]);
  const locked = useSyncExternalStore(subscribe, read, read);

  const setLock = useCallback((next: boolean) => setViewLocked(resolved, next, idsRef.current), [resolved]);
  const toggleLock = useCallback(() => setLock(!isViewLocked(resolved, idsRef.current)), [resolved, setLock]);

  // `initialLocked` applies once per canvas.
  useEffect(() => {
    if (initialLocked) setViewLocked(resolved, true, idsRef.current);
  }, [resolved]); // eslint-disable-line react-hooks/exhaustive-deps

  return { locked, toggleLock, setLock };
}
