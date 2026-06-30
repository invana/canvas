import type { Patch } from 'immer';

import { computeChange } from './patch';
import type { ReactiveStore, StateCell, StoreChange, Update } from './types';

/**
 * Build a full {@link ReactiveStore} on top of a {@link StateCell}. This is where
 * the change/patch/batch logic lives — shared by every adapter (memory, zustand,
 * later Yjs), so they behave identically and only the state container differs.
 */
export function createStoreFromCell<T>(cell: StateCell<T>): ReactiveStore<T> {
  const changeListeners = new Set<(change: StoreChange<T>) => void>();

  // Batch accumulator. While batching, writes mutate a *working* copy (so
  // read-after-write is consistent) and notifications are deferred; at the end we
  // commit once (one state-listener notify + one coalesced change). Inverse blocks
  // are prepended so applying them in order undoes the whole batch.
  let batching = false;
  let working: T = cell.get();
  let batchStart: T = working;
  let batchPatches: Patch[] = [];
  let batchInverse: Patch[] = [];

  function getState(): T {
    return batching ? working : cell.get();
  }

  function emitChange(change: StoreChange<T>): void {
    for (const l of changeListeners) l(change);
  }

  function update(u: Update<T>, action?: string): void {
    const prev = getState();
    const { next, patches, inverse } = computeChange(prev, u);
    if (next === prev) return; // no-op write — nothing changed
    if (batching) {
      working = next;
      batchPatches.push(...patches);
      batchInverse.unshift(...inverse);
    } else {
      cell.set(next); // fires state listeners with (next, prev)
      emitChange({ state: next, prev, action, patches, inverse });
    }
  }

  function batch(run: () => void, action?: string): void {
    if (batching) {
      run(); // a nested batch joins the outer one
      return;
    }
    batching = true;
    batchStart = cell.get();
    working = batchStart;
    batchPatches = [];
    batchInverse = [];
    try {
      run();
    } finally {
      batching = false;
      if (working !== batchStart && batchPatches.length > 0) {
        cell.set(working); // one state-listener notification for the whole batch
        emitChange({
          state: working,
          prev: batchStart,
          action,
          patches: batchPatches,
          inverse: batchInverse,
        });
      }
    }
  }

  return {
    getState,
    update,
    subscribe: (listener) => cell.subscribe(listener),
    subscribeChanges: (listener) => {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
    batch,
  };
}
