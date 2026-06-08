import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import { useViewSection } from '../hooks/useViewSection';

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
  /** Show the lock toggle (needs `icons.locked` + `icons.unlocked`). Default `true`. */
  showLock?: boolean;
  /** Layer the fit-to-content button targets. Default `'graph'`. */
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
 * View bar — zoom in / zoom out / fit-to-content / lock view (the
 * {@link useViewSection} section). Zoom + fit ride the camera hooks; lock
 * disables pan + node drag by default while leaving zoom available.
 */
export function ViewToolbar({
  icons,
  position = 'bottom-left',
  orientation = 'vertical',
  showLock = true,
  layerId = 'graph',
  lockBehaviourIds,
  bare = false,
  canvas,
  className,
}: ViewToolbarProps) {
  const lockIcons =
    showLock && icons.locked && icons.unlocked ? { locked: icons.locked, unlocked: icons.unlocked } : {};
  const items = useViewSection({
    icons: { zoomIn: icons.zoomIn, zoomOut: icons.zoomOut, fit: icons.fit, ...lockIcons },
    layerId,
    ...(lockBehaviourIds ? { lockBehaviourIds } : {}),
    canvas,
  });

  const nav = <ToolbarItems items={items} orientation={orientation} className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
