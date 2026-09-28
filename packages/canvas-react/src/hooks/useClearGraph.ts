import { useCallback } from 'react';
import type { Canvas } from '@invana/canvas';
import { clearGraphLayer } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseClearGraphResult {
  /** Remove every node and edge from the target layer. No-op if the layer doesn't exist yet. */
  clear: () => void;
}

/**
 * Clear-graph action for a specific layer on the resolved canvas.
 *
 * The clear is one undoable `'clear'` entry in `canvas.history` — Undo
 * restores the whole graph and Redo clears it again.
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
  const clear = useCallback(() => clearGraphLayer(resolved, layerId), [resolved, layerId]);

  return { clear };
}
