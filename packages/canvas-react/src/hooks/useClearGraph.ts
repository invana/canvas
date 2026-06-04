import { useCallback, useContext } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';
import { HistoryContext } from '../HistoryContext';

/** Structural guard — any layer that exposes a `clear()` method. */
interface ClearableLayer {
  clear(): void;
}

/** Structural shape of the store we read node ids off for an undoable clear. */
interface StorefulLayer {
  store?: { nodes(): IterableIterator<{ id: string }> };
}

function hasClear(layer: unknown): layer is ClearableLayer {
  return typeof (layer as ClearableLayer | undefined)?.clear === 'function';
}

export interface UseClearGraphResult {
  /** Remove every node and edge from the target layer. No-op if the layer doesn't exist yet. */
  clear: () => void;
}

/**
 * Clear-graph action for a specific layer on the resolved canvas.
 *
 * When a `<GraphHistoryProvider>` is present, the clear runs as a single
 * undoable `history.transaction('clear', …)` — removing every node (edges
 * cascade) so Undo restores the whole graph and Redo clears it again. Without a
 * history provider it falls back to the layer's fast `clear()`.
 *
 * Uses structural duck-types (`clear()` / `store.nodes()`) so it works with any
 * compatible layer without a hard `@invana/graph` import.
 *
 * @param layerId Target layer id (e.g. `'graph'`).
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
export function useClearGraph(
  layerId: string,
  canvas?: EngineCanvas | null,
): UseClearGraphResult {
  const resolved = useResolvedCanvas(canvas);
  const history = useContext(HistoryContext);

  const clear = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    if (!hasClear(layer)) return;

    const store = (layer as StorefulLayer).store;
    if (history && store) {
      // Snapshot ids first — removing mutates the store mid-iteration. Removing
      // every node cascades all incident edges, captured in each removeNode op,
      // so Undo re-adds nodes + edges as one entry.
      const ids = [...store.nodes()].map((n) => n.id);
      if (ids.length > 0) {
        history.transaction('clear', (rec) => {
          for (const id of ids) rec.removeNode(id);
        });
        return;
      }
    }

    layer.clear();
  }, [resolved, layerId, history]);

  return { clear };
}
