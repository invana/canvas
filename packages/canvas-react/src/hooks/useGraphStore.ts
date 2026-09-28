import { useCallback, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphLayer, GraphStore } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

/**
 * The `GraphStore` behind a graph layer — the handle for **incremental** data
 * writes from React (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`,
 * F16, M13): `store.applyDelta(delta, { actor, coalesce: true })` for a feed,
 * instead of replacing the layer's whole `data` prop each tick.
 *
 * Returns `null` until the layer is added, and re-renders when it is added or
 * removed (not on data changes — subscribe to those with `useGraphEvent`).
 *
 * @example
 * const store = useGraphStore('graph');
 * useEffect(() => feed.on('tick', (delta) => store?.applyDelta(delta, { actor: 'feed', coalesce: true })), [store]);
 *
 * @param layerId The `GraphLayer` id. Default `'graph'`.
 * @param canvas Explicit engine instance; defaults to the nearest `<Canvas>`.
 */
export function useGraphStore(layerId = 'graph', canvas?: Canvas | null): GraphStore | null {
  const resolved = useResolvedCanvas(canvas);
  const subscribe = useCallback(
    (onChange: () => void) => {
      const offAdd = resolved.events.on('scene:layer:add', ({ id }) => {
        if (id === layerId) onChange();
      });
      const offRemove = resolved.events.on('scene:layer:remove', ({ id }) => {
        if (id === layerId) onChange();
      });
      return () => {
        offAdd();
        offRemove();
      };
    },
    [resolved, layerId],
  );
  const read = useCallback(
    () => (resolved.layers.get(layerId) as GraphLayer | undefined)?.store ?? null,
    [resolved, layerId],
  );
  return useSyncExternalStore(subscribe, read, read);
}
