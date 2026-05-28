import { NavVertical } from '@invana/ui';

import { LockToggle } from './LockToggle';
import { MinimapToggle } from './MinimapToggle';
import { ZoomControls } from './ZoomControls';
import type { ToolbarIcon } from './types';

export interface GraphViewControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomInIcon: ToolbarIcon;
  zoomOutIcon: ToolbarIcon;

  minimapActive: boolean;
  onToggleMinimap: () => void;
  minimapIcon: ToolbarIcon;

  locked: boolean;
  onToggleLock: () => void;
  lockedIcon: ToolbarIcon;
  unlockedIcon: ToolbarIcon;

  className?: string;
}

/**
 * Turnkey **vertical** view-controls rail: zoom +/- , minimap toggle, and a
 * lock-view toggle, in a `@invana/ui` `NavVertical`. Engine-agnostic — actions
 * are callbacks. Compose the underlying {@link ZoomControls} /
 * {@link MinimapToggle} / {@link LockToggle} primitives directly for a custom
 * arrangement.
 */
export function GraphViewControls({
  onZoomIn,
  onZoomOut,
  zoomInIcon,
  zoomOutIcon,
  minimapActive,
  onToggleMinimap,
  minimapIcon,
  locked,
  onToggleLock,
  lockedIcon,
  unlockedIcon,
  className,
}: GraphViewControlsProps) {
  return (
    <NavVertical
      className={className}
      top={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
          <ZoomControls
            orientation="vertical"
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            zoomInIcon={zoomInIcon}
            zoomOutIcon={zoomOutIcon}
          />
          <MinimapToggle active={minimapActive} onToggle={onToggleMinimap} icon={minimapIcon} />
          <LockToggle
            locked={locked}
            onToggle={onToggleLock}
            lockedIcon={lockedIcon}
            unlockedIcon={unlockedIcon}
          />
        </div>
      }
    />
  );
}
