import { NavHorizontal, NavVertical } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import {
  Panel,
  ZoomControls,
  ZoomPicker,
  FitContentButton,
  LockButton,
} from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';

export interface ViewToolbarIconSet {
  zoomIn: ToolbarIcon;
  zoomOut: ToolbarIcon;
  fit: ToolbarIcon;
  /** Required only when the lock toggle is shown. */
  locked?: ToolbarIcon;
  unlocked?: ToolbarIcon;
}

export interface ViewToolbarProps {
  icons: ViewToolbarIconSet;
  /** Where the toolbar pins. Default `'bottom-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show zoom in/out buttons. Default `true`. */
  showZoom?: boolean;
  /** Show the live NN% readout between the zoom buttons. Default `false`. */
  showZoomLevel?: boolean;
  /** Show the zoom-level preset picker. Default `true`. */
  showZoomPicker?: boolean;
  /** Show the fit-to-content button. Default `true`. */
  showFit?: boolean;
  /** Show the lock toggle (needs `icons.locked` + `icons.unlocked`). Default `true`. */
  showLock?: boolean;
  /** Layer that fit + zoom-picker target. Default `'graph'`. */
  layerId?: string;
  /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
  lockBehaviourIds?: string[];
  /** Render without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * View controls — zoom in/out, zoom-level picker, fit-to-content, lock view.
 * Zoom + fit self-wire through the camera hooks; lock self-wires through
 * {@link useLock} (disables pan + node drag by default, leaving zoom available).
 */
export function ViewToolbar({
  icons,
  position = 'bottom-left',
  orientation = 'vertical',
  showZoom = true,
  showZoomLevel = false,
  showZoomPicker = true,
  showFit = true,
  showLock = true,
  layerId = 'graph',
  lockBehaviourIds,
  bare = false,
  canvas,
  className,
}: ViewToolbarProps) {
  const lockReady = showLock && icons.locked && icons.unlocked;
  const controls = (
    <>
      {showZoom && (
        <ZoomControls
          orientation={orientation}
          canvas={canvas}
          zoomInIcon={icons.zoomIn}
          zoomOutIcon={icons.zoomOut}
          showLevel={showZoomLevel}
        />
      )}
      {showZoomPicker && <ZoomPicker canvas={canvas} layerId={layerId} />}
      {showFit && <FitContentButton icon={icons.fit} canvas={canvas} layerId={layerId} />}
      {lockReady && (
        <LockButton
          lockedIcon={icons.locked!}
          unlockedIcon={icons.unlocked!}
          behaviourIds={lockBehaviourIds}
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
