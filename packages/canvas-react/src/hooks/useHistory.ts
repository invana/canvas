import { useCallback, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseHistoryOptions {
  /** Graph layer id whose `redraw()` the `redraw` action targets. Default `'graph'`. */
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
 * Undo / redo + redraw over `canvas.history` — the canvas's **one operation
 * log**. Graph edits (every `GraphLayer`'s store records its own writes) and
 * definition edits (a Studio editor's `edit:*` applies) are entries in the same
 * log, so `undo` takes back the newest one, whichever it is. The same calls the
 * `history.undo` / `history.redo` commands make, so this hook and a saved Undo
 * button always do the same thing.
 *
 * `canUndo` / `canRedo` stay reactive via `canvas.history.subscribe`. `redraw`
 * goes straight to the layer.
 */
export function useHistory(options: UseHistoryOptions = {}, canvas?: Canvas | null): UseHistoryResult {
  const { layerId = 'graph' } = options;
  const resolved = useResolvedCanvas(canvas);
  const history = resolved.history;

  const subscribe = useCallback((onChange: () => void) => history.subscribe(onChange), [history]);
  // Both flags in one primitive snapshot, so an unrelated change is one compare.
  const read = useCallback(() => (history.canUndo() ? 1 : 0) + (history.canRedo() ? 2 : 0), [history]);
  const flags = useSyncExternalStore(subscribe, read, read);

  const undo = useCallback(() => history.undo(), [history]);
  const redo = useCallback(() => history.redo(), [history]);
  const redraw = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    if (hasRedraw(layer)) layer.redraw();
  }, [resolved, layerId]);

  return { undo, redo, redraw, canUndo: (flags & 1) !== 0, canRedo: (flags & 2) !== 0 };
}
