import { useCallback, useRef, useState } from 'react';

/**
 * Minimal undo/redo history for a single value (the card template).
 *
 * - `set(next)` — replace the present **without** recording (transient: live
 *   drags / typing, so a gesture isn't a hundred undo steps).
 * - `commit(next, tag?)` — record the present onto the undo stack, then set
 *   `next`. Consecutive commits sharing a `tag` within a short window
 *   **coalesce** into one entry (so editing a field reads as one undo step).
 * - `record(snapshot)` — push an explicit restore point (e.g. the pre-drag
 *   state captured on pointer-down), used when the change itself went through
 *   transient `set`s.
 * - `undo` / `redo` / `reset`.
 */
export interface History<T> {
  state: T;
  set: (next: T) => void;
  commit: (next: T, tag?: string) => void;
  record: (snapshot: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (next: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  /**
   * Bumps on **external jumps** (undo / redo / reset) but NOT on live edits
   * (set / commit). Key uncontrolled forms on it so they re-seed after a jump
   * without resetting mid-typing.
   */
  version: number;
}

const COALESCE_MS = 700;

export function useHistory<T>(initial: T): History<T> {
  const [state, setState] = useState<T>(initial);
  const stateRef = useRef<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastTag = useRef<{ tag?: string; time: number }>({ time: 0 });
  const version = useRef(0);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  const apply = useCallback((next: T) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const set = useCallback((next: T) => apply(next), [apply]);

  const commit = useCallback(
    (next: T, tag?: string) => {
      const now = Date.now();
      const coalesce =
        tag !== undefined && lastTag.current.tag === tag && now - lastTag.current.time < COALESCE_MS;
      if (!coalesce) {
        past.current.push(stateRef.current);
        future.current = [];
      }
      lastTag.current = { tag, time: now };
      apply(next);
      rerender();
    },
    [apply, rerender],
  );

  const record = useCallback(
    (snapshot: T) => {
      past.current.push(snapshot);
      future.current = [];
      lastTag.current = { time: 0 };
      rerender();
    },
    [rerender],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (prev === undefined) return;
    future.current.push(stateRef.current);
    lastTag.current = { time: 0 };
    version.current += 1;
    apply(prev);
    rerender();
  }, [apply, rerender]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(stateRef.current);
    lastTag.current = { time: 0 };
    version.current += 1;
    apply(next);
    rerender();
  }, [apply, rerender]);

  const reset = useCallback(
    (next: T) => {
      past.current = [];
      future.current = [];
      lastTag.current = { time: 0 };
      version.current += 1;
      apply(next);
      rerender();
    },
    [apply, rerender],
  );

  return {
    state,
    set,
    commit,
    record,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    version: version.current,
  };
}
