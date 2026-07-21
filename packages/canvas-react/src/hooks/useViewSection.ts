import type { Canvas } from '@invana/canvas';
import { Lock, LockOpen, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

import type { ToolbarItem } from '../uiModel';
import { useZoom } from './useZoom';
import { useFitContent } from './useFitContent';
import { useLock } from './useLock';

export interface UseViewSectionOptions {
  /** Include the zoom-in / zoom-out buttons. Default `true`. */
  showZoom?: boolean;
  /** Include the lock-view toggle. Default `true`. */
  showLock?: boolean;
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
 * {@link useLock}. Set `showZoom: false` to omit the two zoom buttons (fit stays);
 * the lock is a toggle whose icon flips unlocked↔locked (set `showLock: false` to
 * omit it); locking disables pan + node drag by default while leaving zoom
 * available. Icons are baked in.
 */
export function useViewSection(options: UseViewSectionOptions = {}): ToolbarItem[] {
  const { showZoom = true, showLock = true, layerId = 'graph', lockBehaviourIds, canvas } = options;
  const { zoomIn, zoomOut } = useZoom(canvas);
  const { fitContent } = useFitContent(layerId, canvas);
  const { locked, toggleLock } = useLock(
    lockBehaviourIds ? { behaviourIds: lockBehaviourIds } : {},
    canvas,
  );

  const items: ToolbarItem[] = [];
  if (showZoom) {
    items.push(
      { type: 'button', key: 'zoom-in', icon: ZoomIn, label: 'Zoom in', onClick: () => zoomIn() },
      { type: 'button', key: 'zoom-out', icon: ZoomOut, label: 'Zoom out', onClick: () => zoomOut() },
    );
  }
  items.push({ type: 'button', key: 'fit', icon: Maximize, label: 'Fit to content', onClick: () => fitContent() });
  if (showLock) {
    items.push({
      type: 'toggle',
      key: 'lock',
      icon: LockOpen,
      activeIcon: Lock,
      label: 'Lock view',
      activeLabel: 'Unlock view',
      active: locked,
      onToggle: toggleLock,
    });
  }
  return items;
}
