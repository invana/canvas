import { useCallback, useContext } from 'react';
import type { Canvas } from '@invana/canvas';
import { clearGraphLayer } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';
import { HistoryContext } from '../HistoryContext';

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
 * Shares its logic with the `graph.clear` command (`clearGraphLayer` in `@invana/graph`).
 *
 * @param layerId Target layer id (e.g. `'graph'`).
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
export function useClearGraph(
  layerId: string,
  canvas?: Canvas | null,
): UseClearGraphResult {
  const resolved = useResolvedCanvas(canvas);
  const history = useContext(HistoryContext);

  const clear = useCallback(
    () => clearGraphLayer(resolved, layerId, history),
    [resolved, layerId, history],
  );

  return { clear };
}
