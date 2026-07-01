import { useMemo, useSyncExternalStore } from 'react';
import { select, type ReactiveStore } from '@invana/canvas-store';

/**
 * Bind a React component to **one slice** of a kernel {@link ReactiveStore} (e.g.
 * `canvas.store.view`). The component re-renders **only** when the selected slice
 * changes (by `isEqual`, default `Object.is`) — idle slices cost nothing. Backed by
 * `useSyncExternalStore` over the kernel's `select` port, so it survives a backend
 * swap (zustand → Yjs).
 *
 * **Selector stability (R4).** Pass a **stable** `selector` — a module-scope function
 * or one wrapped in `useCallback` — and have it return a **referentially-stable**
 * slice (a sub-object the store keeps identity-stable between unrelated updates, not
 * a freshly-built object each call). Deriving a new object per call throws
 * "getSnapshot should be cached"; derive in `useMemo` from a stable slice instead.
 * For derived slices that legitimately change identity, pass `shallowEqual`.
 *
 * @example
 * const selectDefinition = (s: CanvasView) => s.definition;   // module scope
 * const definition = useStore(canvas.store.view, selectDefinition);
 */
export function useStore<T, U>(
  store: ReactiveStore<T>,
  selector: (state: T) => U,
  isEqual?: (a: U, b: U) => boolean,
): U {
  const selected = useMemo(
    () => select(store, selector, isEqual),
    [store, selector, isEqual],
  );
  return useSyncExternalStore(selected.subscribe, selected.get, selected.get);
}
