import { useCallback } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/** Structural guard — any layer that exposes a `clear()` method. */
interface ClearableLayer {
  clear(): void;
}

function hasClear(layer: unknown): layer is ClearableLayer {
  return typeof (layer as ClearableLayer | undefined)?.clear === 'function';
}

export interface UseClearGraphResult {
  /** Remove every node and edge from the target layer. No-op if the layer doesn't exist yet. */
  clear: () => void;
}

/**
 * Clear-graph action for a specific layer on the resolved canvas. Uses a
 * structural duck-type check for `clear()` so it works with any layer that
 * exposes the method (e.g. `GraphLayer`) without a hard import dependency.
 *
 * @param layerId Target layer id (e.g. `'graph'`).
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
export function useClearGraph(
  layerId: string,
  canvas?: EngineCanvas | null,
): UseClearGraphResult {
  const resolved = useResolvedCanvas(canvas);

  const clear = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    if (hasClear(layer)) {
      layer.clear();
    }
  }, [resolved, layerId]);

  return { clear };
}
