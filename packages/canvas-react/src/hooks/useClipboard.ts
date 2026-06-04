import { useCallback, useContext, useEffect, useState } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { ClickSelectBehaviour } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useSelection } from './useSelection';
import { ClipboardContext } from '../ClipboardContext';
import { HistoryContext } from '../HistoryContext';

export interface UseClipboardOptions {
  /** Id of the `ClickSelectBehaviour` selection is read from / re-applied to. Default `'click-select'`. */
  clickSelectId?: string;
}

export interface UseClipboardResult {
  /** Copy the selection to the buffer, then delete it (one undoable step). */
  cut: () => void;
  /** Copy the selection to the buffer. */
  copy: () => void;
  /** Paste the buffer (offset + re-id'd) and select the pasted items. */
  paste: () => void;
  /** Delete the selection (one undoable step). */
  remove: () => void;
  /** True iff the buffer has content to paste. */
  canPaste: boolean;
  /** True iff something is selected. */
  hasSelection: boolean;
}

/**
 * Cut / copy / paste / delete for the current selection, wired to the
 * `GraphClipboard` from a `<GraphClipboardProvider>` ancestor. Operations route
 * through the `<GraphHistoryProvider>`'s history when present, so they're
 * undoable. Reads the selection (and re-selects pasted items) via a
 * `ClickSelectBehaviour`.
 *
 * `canPaste` tracks the buffer (recomputed after each op); `hasSelection` is
 * reactive via {@link useSelection}.
 */
export function useClipboard(
  options: UseClipboardOptions = {},
  canvas?: EngineCanvas | null,
): UseClipboardResult {
  const { clickSelectId = 'click-select' } = options;
  const resolved = useResolvedCanvas(canvas);
  const clipboard = useContext(ClipboardContext);
  const history = useContext(HistoryContext);
  const { selectedNodeIds, selectedEdgeIds, count } = useSelection({ clickSelectId }, resolved);
  const [canPaste, setCanPaste] = useState(false);

  // Subscribe to the clipboard's buffer-change event so every `useClipboard`
  // instance stays in sync — e.g. the Paste button reacts to a Copy that
  // happened in a different button's hook instance.
  useEffect(() => {
    if (!clipboard) {
      setCanPaste(false);
      return;
    }
    setCanPaste(clipboard.hasContent);
    return clipboard.events.on('change', ({ hasContent }) => setCanPaste(hasContent));
  }, [clipboard]);

  const copy = useCallback(() => {
    clipboard?.copy(selectedNodeIds, selectedEdgeIds);
  }, [clipboard, selectedNodeIds, selectedEdgeIds]);

  const cut = useCallback(() => {
    clipboard?.cut(selectedNodeIds, selectedEdgeIds, history ?? undefined);
  }, [clipboard, history, selectedNodeIds, selectedEdgeIds]);

  const remove = useCallback(() => {
    clipboard?.delete(selectedNodeIds, selectedEdgeIds, history ?? undefined);
  }, [clipboard, history, selectedNodeIds, selectedEdgeIds]);

  const paste = useCallback(() => {
    if (!clipboard) return;
    const { nodeIds, edgeIds } = clipboard.paste(history ?? undefined);
    const behaviour = resolved.behaviours.get<ClickSelectBehaviour>(clickSelectId);
    behaviour?.selectMultiple([
      ...nodeIds.map((id) => ({ id, type: 'shape' as const })),
      ...edgeIds.map((id) => ({ id, type: 'connector' as const })),
    ]);
  }, [clipboard, history, resolved, clickSelectId]);

  return { cut, copy, paste, remove, canPaste, hasSelection: count > 0 };
}
