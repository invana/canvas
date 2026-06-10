import type { Canvas } from '@invana/canvas';

import type { ToolbarItem } from '../components/ToolbarItem';
import type { ToolbarIcon } from '../components/types';
import { useClipboard } from './useClipboard';
import { useClearGraph } from './useClearGraph';

export interface UseEditorSectionOptions {
  /** Icons for cut / copy / paste / erase. */
  icons: { cut: ToolbarIcon; copy: ToolbarIcon; paste: ToolbarIcon; erase: ToolbarIcon };
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Layer that erase / clipboard target. Default `'graph'`. */
  layerId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/**
 * **Editor** toolbar section — cut / copy / paste / erase {@link ToolbarItem}s
 * built off {@link useClipboard} + {@link useClearGraph}. Cut/copy disable
 * without a selection, paste until something is copied. Erase is selection-aware
 * — it deletes the selection (with a "Selection" label) when something is
 * selected, otherwise clears the whole layer. Requires a
 * `<GraphClipboardProvider>` + `ClickSelectBehaviour`; edits are undoable with a
 * `<GraphHistoryProvider>`.
 */
export function useEditorSection(options: UseEditorSectionOptions): ToolbarItem[] {
  const { icons, clickSelectId, layerId = 'graph', canvas } = options;
  const { cut, copy, paste, remove, canPaste, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  const { clear } = useClearGraph(layerId, canvas);

  return [
    { type: 'button', key: 'cut', icon: icons.cut, label: 'Cut', onClick: cut, disabled: !hasSelection },
    { type: 'button', key: 'copy', icon: icons.copy, label: 'Copy', onClick: copy, disabled: !hasSelection },
    { type: 'button', key: 'paste', icon: icons.paste, label: 'Paste', onClick: paste, disabled: !canPaste },
    {
      type: 'button',
      key: 'erase',
      icon: icons.erase,
      label: hasSelection ? 'Erase selection' : 'Clear canvas',
      ...(hasSelection ? { text: 'Selection' } : {}),
      onClick: hasSelection ? remove : () => clear(),
    },
  ];
}
