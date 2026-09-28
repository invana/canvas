import { useCallback, useContext, useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import { copySelection, cutSelection, deleteSelection, pasteAndSelect } from '@invana/graph';

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
 *
 * The actions are `@invana/graph`'s `cutSelection` / `copySelection` /
 * `deleteSelection` / `pasteAndSelect` — the same functions the `clipboard.*`
 * commands run — and read the click-selection at call time, so they never act
 * on a selection captured in a stale closure.
 */
export function useClipboard(
  options: UseClipboardOptions = {},
  canvas?: Canvas | null,
): UseClipboardResult {
  const { clickSelectId = 'click-select' } = options;
  const resolved = useResolvedCanvas(canvas);
  const clipboard = useContext(ClipboardContext);
  const history = useContext(HistoryContext);
  // Only for the reactive `hasSelection`; the actions read the selection at call time.
  const { count } = useSelection({ clickSelectId }, resolved);
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
    if (clipboard) copySelection(resolved, clipboard, clickSelectId);
  }, [clipboard, resolved, clickSelectId]);

  const cut = useCallback(() => {
    if (clipboard) cutSelection(resolved, clipboard, history, clickSelectId);
  }, [clipboard, history, resolved, clickSelectId]);

  const remove = useCallback(() => {
    if (clipboard) deleteSelection(resolved, clipboard, history, clickSelectId);
  }, [clipboard, history, resolved, clickSelectId]);

  const paste = useCallback(() => {
    if (clipboard) pasteAndSelect(resolved, clipboard, history, clickSelectId);
  }, [clipboard, history, resolved, clickSelectId]);

  return { cut, copy, paste, remove, canPaste, hasSelection: count > 0 };
}
