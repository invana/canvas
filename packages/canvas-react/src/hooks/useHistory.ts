import { useCallback, useContext, useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';
import { HistoryContext } from '../HistoryContext';

export interface UseHistoryOptions {
  /** Layer id whose `redraw()` the `redraw` action targets. Default `'graph'`. */
  layerId?: string;
}

export interface UseHistoryResult {
  /** Revert the most recent change. No-op when `!canUndo`. */
  undo: () => void;
  /** Re-apply the most recently undone change. No-op when `!canRedo`. */
  redo: () => void;
  /** Force a full re-render of the target layer (render pass; not undoable). */
  redraw: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface RedrawableLayer {
  redraw(): void;
}

function hasRedraw(layer: unknown): layer is RedrawableLayer {
  return typeof (layer as RedrawableLayer | undefined)?.redraw === 'function';
}

/**
 * Undo/redo + redraw, wired to the `GraphHistory` from a
 * `<GraphHistoryProvider>` ancestor. `canUndo`/`canRedo` stay reactive via the
 * history's `change` event. Without a provider, undo/redo are no-ops and the
 * flags are `false` (redraw still works — it goes straight to the layer).
 */
export function useHistory(
  options: UseHistoryOptions = {},
  canvas?: Canvas | null,
): UseHistoryResult {
  const { layerId = 'graph' } = options;
  const resolved = useResolvedCanvas(canvas);
  const history = useContext(HistoryContext);
  const [state, setState] = useState({ canUndo: false, canRedo: false });

  useEffect(() => {
    if (!history) {
      setState({ canUndo: false, canRedo: false });
      return;
    }
    setState({ canUndo: history.canUndo, canRedo: history.canRedo });
    return history.events.on('change', ({ canUndo, canRedo }) => setState({ canUndo, canRedo }));
  }, [history]);

  const undo = useCallback(() => history?.undo(), [history]);
  const redo = useCallback(() => history?.redo(), [history]);
  const redraw = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    if (hasRedraw(layer)) layer.redraw();
  }, [resolved, layerId]);

  return { undo, redo, redraw, canUndo: state.canUndo, canRedo: state.canRedo };
}
