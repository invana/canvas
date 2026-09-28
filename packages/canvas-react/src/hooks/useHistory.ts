import { useCallback, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';
import { canRedoEither, canUndoEither, redoNewest, undoNewest } from '@invana/graph';

import { useGraphHistory } from './useGraphEditState';
import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseHistoryOptions {
  /**
   * Graph layer id: whose canvas-owned `GraphHistory` is used when no
   * `<GraphHistoryProvider>` is above, and whose `redraw()` the `redraw` action
   * targets. Default `'graph'`.
   */
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
 * Undo/redo + redraw over the canvas's **one operation log** — graph edits
 * (recorded by the layer's store; the `GraphHistory` from a
 * `<GraphHistoryProvider>` ancestor, else the one the `GraphCanvas` owns for
 * `layerId` — see {@link useGraphHistory}) and definition edits (a Studio
 * editor's `edit:*` applies) are entries in the same log, so `undo` takes back
 * the newest one, whichever it is. `@invana/graph`'s `undoNewest` /
 * `redoNewest` — the same functions the `history.undo` / `history.redo`
 * commands call — so this hook and a saved Undo button always do the same thing.
 *
 * `canUndo` / `canRedo` stay reactive via `canvas.history`'s subscription (and
 * the graph history's `change` event). `redraw` goes straight to the layer.
 *
 * Changed 2026-09-29 (H9): `undo` / `redo` / `canUndo` / `canRedo` used to act
 * on the graph stack only. Changed 2026-09-28 (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F4): the two
 * stacks became one log; there is no "newer top" arbitration any more.
 */
export function useHistory(
  options: UseHistoryOptions = {},
  canvas?: Canvas | null,
): UseHistoryResult {
  const { layerId = 'graph' } = options;
  const resolved = useResolvedCanvas(canvas);
  const history = useGraphHistory(layerId, resolved);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const offs = [resolved.history.subscribe(onChange)];
      if (history) offs.push(history.events.on('change', onChange));
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved, history],
  );
  // Both flags in one primitive snapshot, so an unrelated change is one compare.
  const read = useCallback(
    () => (canUndoEither(resolved, history) ? 1 : 0) + (canRedoEither(resolved, history) ? 2 : 0),
    [resolved, history],
  );
  const flags = useSyncExternalStore(subscribe, read, read);

  const undo = useCallback(() => undoNewest(resolved, history), [resolved, history]);
  const redo = useCallback(() => redoNewest(resolved, history), [resolved, history]);
  const redraw = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    if (hasRedraw(layer)) layer.redraw();
  }, [resolved, layerId]);

  return { undo, redo, redraw, canUndo: (flags & 1) !== 0, canRedo: (flags & 2) !== 0 };
}
