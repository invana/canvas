import { createStoreFromCell } from './store-core';
import type { ReactiveStore, StateCell } from './types';

/**
 * A dependency-free, in-memory {@link ReactiveStore} — the reference adapter.
 *
 * Imports **no** backend library, so it proves the {@link ReactiveStore} port is
 * real and swappable (the zustand adapter must behave identically). Also the
 * lightest backend for tests.
 */
export function createMemoryStore<T extends object>(initial: T): ReactiveStore<T> {
  let state = initial;
  const listeners = new Set<(state: T, prev: T) => void>();

  const cell: StateCell<T> = {
    get: () => state,
    set: (next) => {
      const prev = state;
      state = next;
      for (const l of listeners) l(next, prev);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return createStoreFromCell(cell);
}
