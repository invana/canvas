import { NavHorizontal, NavVertical } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, CutButton, CopyButton, PasteButton, ClearButton } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';

export interface EditToolbarIconSet {
  cut: ToolbarIcon;
  copy: ToolbarIcon;
  paste: ToolbarIcon;
  /**
   * Eraser icon for the selection-aware clear button — deletes the selection
   * when something is selected, otherwise clears the whole canvas.
   */
  clear: ToolbarIcon;
}

export interface EditToolbarProps {
  icons: EditToolbarIconSet;
  /** Where the toolbar pins. Default `'top-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show the clear-canvas button. Default `true`. */
  showClear?: boolean;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Layer that clear / clipboard target. Default `'graph'`. */
  layerId?: string;
  /** Render without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Clipboard / edit bar — cut, copy, paste, and a selection-aware erase button
 * (deletes the selection when something is selected, otherwise clears the whole
 * canvas). The clipboard actions self-wire through {@link useClipboard} (require
 * a `<GraphClipboardProvider>` + a `ClickSelectBehaviour`); clear self-wires
 * through {@link useClearGraph}. All edits are undoable when a
 * `<GraphHistoryProvider>` is present.
 */
export function EditToolbar({
  icons,
  position = 'top-left',
  orientation = 'horizontal',
  showClear = true,
  clickSelectId,
  layerId,
  bare = false,
  canvas,
  className,
}: EditToolbarProps) {
  const controls = (
    <>
      <CutButton icon={icons.cut} clickSelectId={clickSelectId} canvas={canvas} />
      <CopyButton icon={icons.copy} clickSelectId={clickSelectId} canvas={canvas} />
      <PasteButton icon={icons.paste} clickSelectId={clickSelectId} canvas={canvas} />
      {showClear && (
        <ClearButton
          icon={icons.clear}
          layerId={layerId}
          clickSelectId={clickSelectId}
          canvas={canvas}
        />
      )}
    </>
  );

  const nav =
    orientation === 'vertical' ? (
      <NavVertical top={controls} className={className} />
    ) : (
      <NavHorizontal left={controls} className={className} />
    );

  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
