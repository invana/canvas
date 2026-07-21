import type { Canvas } from '@invana/canvas';
import { Redo2, Undo2 } from 'lucide-react';

import type { ToolbarItem } from '../uiModel';
import { useHistory } from './useHistory';

export interface UseHistorySectionOptions {
  /** Layer scope for history. Default `'graph'`. */
  layerId?: string;
  /** Override the default tooltips / accessible labels. */
  labels?: { undo?: string; redo?: string };
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/**
 * **History** toolbar section — undo / redo {@link ToolbarItem}s built off
 * {@link useHistory}, with live `disabled` state (`!canUndo` / `!canRedo`).
 * Compose the result with other sections and render via `ToolbarItems`. Requires
 * a `<GraphHistoryProvider>` ancestor.
 */
export function useHistorySection(options: UseHistorySectionOptions = {}): ToolbarItem[] {
  const { layerId, labels, canvas } = options;
  const { undo, redo, canUndo, canRedo } = useHistory(layerId ? { layerId } : {}, canvas);
  return [
    { type: 'button', key: 'undo', icon: Undo2, label: labels?.undo ?? 'Undo', onClick: undo, disabled: !canUndo },
    { type: 'button', key: 'redo', icon: Redo2, label: labels?.redo ?? 'Redo', onClick: redo, disabled: !canRedo },
  ];
}
