import type { Canvas } from '@invana/canvas';
import { ClipboardPaste, Copy, Eraser, Scissors } from 'lucide-react';

import type { ToolbarItem } from '../uiModel';
import { useClipboard } from './useClipboard';
import { useClearGraph } from './useClearGraph';

/** The editor items this section can render, in canonical order. */
export type EditorItemKey = 'cut' | 'copy' | 'paste' | 'erase';

export interface UseEditorSectionOptions {
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Layer that erase / clipboard target. Default `'graph'`. */
  layerId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  /**
   * Which items to include, in canonical (cut · copy · paste · erase) order.
   * Default: all four. Pass e.g. `['erase']` for an erase-only bar (no
   * clipboard) — cut/copy/paste are simply omitted.
   */
  items?: EditorItemKey[];
}

/**
 * **Editor** toolbar section — cut / copy / paste / erase {@link ToolbarItem}s
 * built off {@link useClipboard} + {@link useClearGraph}. Cut/copy disable
 * without a selection, paste until something is copied. Erase is selection-aware
 * — it deletes the selection (with a "Selection" label) when something is
 * selected, otherwise clears the whole layer. Requires a
 * `<GraphClipboardProvider>` + `ClickSelectBehaviour`; edits are undoable
 * through `canvas.history`. Restrict the set via {@link UseEditorSectionOptions.items}
 * — e.g. `items: ['erase']` for an erase-only bar with no clipboard controls.
 *
 * @deprecated A second way to draw toolbar controls beside the control specs
 * `useControlItems` (in `@invana/canvas-ui`) renders. Use the `clipboard.*` / `graph.erase` / `graph.clear` control specs (`EDIT_CONTROL_ITEMS`), or
 *   {@link useClipboard} / {@link useClearGraph} for bespoke UI.
 * Kept for compatibility; removal waits for the next breaking release
 * (`rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` X1).
 */
export function useEditorSection(options: UseEditorSectionOptions = {}): ToolbarItem[] {
  const { clickSelectId, layerId = 'graph', canvas, items } = options;
  const { cut, copy, paste, remove, canPaste, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  const { clear } = useClearGraph(layerId, canvas);

  const all: Record<EditorItemKey, ToolbarItem> = {
    cut: { type: 'button', key: 'cut', icon: Scissors, label: 'Cut', onClick: cut, disabled: !hasSelection },
    copy: { type: 'button', key: 'copy', icon: Copy, label: 'Copy', onClick: copy, disabled: !hasSelection },
    paste: { type: 'button', key: 'paste', icon: ClipboardPaste, label: 'Paste', onClick: paste, disabled: !canPaste },
    erase: {
      type: 'button',
      key: 'erase',
      icon: Eraser,
      label: hasSelection ? 'Erase selection' : 'Clear canvas',
      ...(hasSelection ? { text: 'Selection' } : {}),
      onClick: hasSelection ? remove : () => clear(),
    },
  };

  const keys = items ?? (['cut', 'copy', 'paste', 'erase'] as EditorItemKey[]);
  return keys.map((k) => all[k]);
}
