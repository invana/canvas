import type { Canvas } from '@invana/canvas';

import type { ToolbarItem } from '../components/ToolbarItem';
import type { ToolbarIcon } from '../components/types';
import { useHistory } from './useHistory';

export interface UseHistorySectionOptions {
  /** Icons for the undo / redo buttons. */
  icons: { undo: ToolbarIcon; redo: ToolbarIcon };
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
export function useHistorySection(options: UseHistorySectionOptions): ToolbarItem[] {
  const { icons, layerId, labels, canvas } = options;
  const { undo, redo, canUndo, canRedo } = useHistory(layerId ? { layerId } : {}, canvas);
  return [
    { type: 'button', key: 'undo', icon: icons.undo, label: labels?.undo ?? 'Undo', onClick: undo, disabled: !canUndo },
    { type: 'button', key: 'redo', icon: icons.redo, label: labels?.redo ?? 'Redo', onClick: redo, disabled: !canRedo },
  ];
}
