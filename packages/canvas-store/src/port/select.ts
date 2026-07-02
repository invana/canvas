import type { ReactiveStore } from './types';

/** Reference-equality default; selector slices are compared with this. */
export function defaultEqual<U>(a: U, b: U): boolean {
  return Object.is(a, b);
}

/** Shallow-equal for objects/arrays — a common selector equality for derived slices. */
export function shallowEqual<U>(a: U, b: U): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const ak = Object.keys(a as Record<string, unknown>);
  const bk = Object.keys(b as Record<string, unknown>);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

/** A subscribable view of one selected slice — what `useSyncExternalStore` binds to. */
export interface Selected<U> {
  get(): U;
  subscribe(onChange: () => void): () => void;
}

/**
 * Project a {@link ReactiveStore} to one slice, re-notifying **only** when that
 * slice changes (by `isEqual`). Selector + equality semantics live here — in our
 * code, not the backend — so they survive a backend swap. The React `useStore`
 * hook (in `@invana/canvas-react`) binds this to `useSyncExternalStore`.
 */
export function select<T, U>(
  store: ReactiveStore<T>,
  selector: (state: T) => U,
  isEqual: (a: U, b: U) => boolean = defaultEqual,
): Selected<U> {
  return {
    get: () => selector(store.getState()),
    subscribe: (onChange) => {
      let current = selector(store.getState());
      return store.subscribe((state) => {
        const next = selector(state);
        if (!isEqual(current, next)) {
          current = next;
          onChange();
        }
      });
    },
  };
}
