import { createStore } from 'zustand/vanilla';

import { createStoreFromCell } from '../../port/store-core';
import type { ReactiveStore, StateCell } from '../../port/types';

/**
 * The zustand-backed {@link ReactiveStore} adapter — **the only file in the
 * package allowed to import zustand** (lint-enforceable). State container +
 * subscription come from zustand vanilla; the declarative-patch / change-stream /
 * batch logic is the shared {@link createStoreFromCell} core, so this behaves
 * identically to {@link createMemoryStore} (port parity).
 */
export function createReactiveStore<T extends object>(initial: T): ReactiveStore<T> {
  const z = createStore<T>(() => initial);

  const cell: StateCell<T> = {
    get: () => z.getState(),
    // `replace: true` — we hand zustand the whole next state (produced by immer).
    set: (next) => z.setState(next, true),
    subscribe: (listener) => z.subscribe(listener),
  };

  return createStoreFromCell(cell);
}
