import { NavHorizontal, NavVertical } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, UndoButton, RedoButton, RedrawButton } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';

export interface HistoryToolbarIconSet {
  undo: ToolbarIcon;
  redo: ToolbarIcon;
  /** Required only when `showRedraw` is left on. */
  redraw?: ToolbarIcon;
}

export interface HistoryToolbarProps {
  icons: HistoryToolbarIconSet;
  /** Where the toolbar pins. Default `'top-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show the redraw button (needs `icons.redraw`). Default `true`. */
  showRedraw?: boolean;
  /** Layer the redraw button targets. Default `'graph'`. */
  layerId?: string;
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Undo / redo / redraw bar. Self-wires through {@link useHistory}; requires a
 * `<GraphHistoryProvider>` ancestor for undo/redo (redraw works regardless).
 */
export function HistoryToolbar({
  icons,
  position = 'top-left',
  orientation = 'horizontal',
  showRedraw = true,
  layerId,
  bare = false,
  canvas,
  className,
}: HistoryToolbarProps) {
  const controls = (
    <>
      <UndoButton icon={icons.undo} canvas={canvas} />
      <RedoButton icon={icons.redo} canvas={canvas} />
      {showRedraw && icons.redraw && (
        <RedrawButton icon={icons.redraw} layerId={layerId} canvas={canvas} />
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
