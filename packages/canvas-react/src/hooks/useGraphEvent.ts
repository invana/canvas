import { useEffect, useRef } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphLayer, GraphStoreEventMap } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

/**
 * The graph events a component can subscribe to via {@link useGraphEvent} — the
 * fine-grained `GraphStore` stream (`node:add`, `node:visibility`, `edge:*`, …)
 * plus the handful of `GraphLayer`-level signals a UI typically reacts to.
 *
 * The layer-level entries are declared by hand rather than pulled from
 * `GraphLayerEvents` because that interface carries a `[event: string]: unknown`
 * index signature (open for future pointer/gesture events), which would collapse
 * `keyof` to `string` and lose per-event payload typing. Add new layer events
 * here as they become worth subscribing to from React.
 */
export interface GraphEventMap extends GraphStoreEventMap {
  /** A group container was hidden/shown as a unit (`hideGroup`/`showGroup`). */
  'group:visibility': { groupId: string; hidden: boolean };
  /** Aggregated per-flush topology/position change on the layer. */
  'data:changed': {
    addedNodes: number;
    removedNodes: number;
    updatedNodes: number;
    addedEdges: number;
    removedEdges: number;
    updatedEdges: number;
  };
  /** The layer-level style template changed. */
  'style:changed': { scope: 'node' | 'edge' | 'state' };
}

/** Event names sourced from the layer emitter rather than the store emitter. */
const LAYER_EVENTS = new Set<keyof GraphEventMap>([
  'group:visibility',
  'data:changed',
  'style:changed',
]);

export interface UseGraphEventOptions {
  /** Explicit engine instance (out-of-`<Canvas>` / multi-canvas). Defaults to context. */
  canvas?: Canvas | null;
  /** Id of the `GraphLayer` to observe. Defaults to `'graph'`. */
  layerId?: string;
}

/**
 * Subscribe to a graph event — a `GraphStore` event (`node:visibility`,
 * `edge:visibility`, `node:add`, …) or a `GraphLayer` event (`group:visibility`,
 * `data:changed`, `style:changed`) — for the lifetime of the calling component.
 *
 * Resolves the engine like the other canvas hooks (context or explicit
 * `opts.canvas`), looks up the `GraphLayer` by `opts.layerId` (default
 * `'graph'`), and attaches to the right emitter (`layer.store.events` or
 * `layer.events`). The handler is held in a ref, so changing it between renders
 * does **not** re-subscribe; only a change of the resolved canvas, layer id, or
 * event name does. No-op (until the layer exists) when the id isn't mounted yet.
 *
 * @example
 * useGraphEvent('node:visibility', () => setHidden([...layer.store.hiddenNodes()]));
 * useGraphEvent('group:visibility', ({ groupId, hidden }) => …);
 */
export function useGraphEvent<K extends keyof GraphEventMap>(
  event: K,
  handler: (payload: GraphEventMap[K]) => void,
  opts: UseGraphEventOptions = {},
): void {
  const resolved = useResolvedCanvas(opts.canvas);
  const layerId = opts.layerId ?? 'graph';
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const layer = resolved.layers.get(layerId) as GraphLayer | undefined;
    if (!layer) return;
    const emitter = LAYER_EVENTS.has(event) ? layer.events : layer.store.events;
    // `emitter.on` returns its unsubscribe; the event name is valid for exactly
    // one of the two maps, so a single cast bridges the union at the call site.
    return (emitter.on as (name: K, fn: (p: GraphEventMap[K]) => void) => () => void)(
      event,
      (payload) => handlerRef.current(payload),
    );
  }, [resolved, layerId, event]);
}
