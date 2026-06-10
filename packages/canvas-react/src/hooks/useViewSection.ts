import type { Canvas } from '@invana/canvas';

import type { ToolbarItem } from '../components/ToolbarItem';
import type { ToolbarIcon } from '../components/types';
import { useZoom } from './useZoom';
import { useFitContent } from './useFitContent';
import { useLock } from './useLock';

export interface UseViewSectionIconSet {
  zoomIn: ToolbarIcon;
  zoomOut: ToolbarIcon;
  fit: ToolbarIcon;
  /** Required only when the lock toggle is shown. */
  locked?: ToolbarIcon;
  unlocked?: ToolbarIcon;
}

export interface UseViewSectionOptions {
  icons: UseViewSectionIconSet;
  /** Layer the fit-to-content button targets. Default `'graph'`. */
  layerId?: string;
  /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
  lockBehaviourIds?: string[];
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/**
 * **View** toolbar section — zoom in / zoom out / fit-to-content / lock-view
 * {@link ToolbarItem}s built off {@link useZoom} + {@link useFitContent} +
 * {@link useLock}. The lock is a toggle whose icon flips unlocked↔locked
 * (omitted unless both `icons.locked` + `icons.unlocked` are given); locking
 * disables pan + node drag by default while leaving zoom available.
 */
export function useViewSection(options: UseViewSectionOptions): ToolbarItem[] {
  const { icons, layerId = 'graph', lockBehaviourIds, canvas } = options;
  const { zoomIn, zoomOut } = useZoom(canvas);
  const { fitContent } = useFitContent(layerId, canvas);
  const { locked, toggleLock } = useLock(
    lockBehaviourIds ? { behaviourIds: lockBehaviourIds } : {},
    canvas,
  );

  const items: ToolbarItem[] = [
    { type: 'button', key: 'zoom-in', icon: icons.zoomIn, label: 'Zoom in', onClick: () => zoomIn() },
    { type: 'button', key: 'zoom-out', icon: icons.zoomOut, label: 'Zoom out', onClick: () => zoomOut() },
    { type: 'button', key: 'fit', icon: icons.fit, label: 'Fit to content', onClick: () => fitContent() },
  ];
  if (icons.locked && icons.unlocked) {
    items.push({
      type: 'toggle',
      key: 'lock',
      icon: icons.unlocked,
      activeIcon: icons.locked,
      label: 'Lock view',
      activeLabel: 'Unlock view',
      active: locked,
      onToggle: toggleLock,
    });
  }
  return items;
}
