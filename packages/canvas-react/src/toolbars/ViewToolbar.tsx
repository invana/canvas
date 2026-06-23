import type { Canvas } from '@invana/canvas';

import { Panel, ToolbarItems, applyIconOverrides } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import { useViewSection } from '../hooks/useViewSection';

export interface ViewToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'zoom-in' | 'zoom-out' | 'fit' | 'lock', ToolbarIcon>>;
  /** Where the toolbar pins. Default `'bottom-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show the lock toggle. Default `true`. */
  showLock?: boolean;
  /** Layer the fit-to-content button targets. Default `'graph'`. */
  layerId?: string;
  /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
  lockBehaviourIds?: string[];
  /** Render without the `<Panel>` wrapper. Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * View bar — zoom in / zoom out / fit-to-content / lock view (the
 * {@link useViewSection} section). Zoom + fit ride the camera hooks; lock
 * disables pan + node drag by default while leaving zoom available. Icons are
 * baked in (lucide).
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
  const items = useViewSection({
    showLock,
    layerId,
    ...(lockBehaviourIds ? { lockBehaviourIds } : {}),
    canvas,
  });

  const nav = (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
