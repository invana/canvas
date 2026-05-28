import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomInIcon: ToolbarIcon;
  zoomOutIcon: ToolbarIcon;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/** A pair of zoom-in / zoom-out icon buttons. Engine-agnostic (callbacks only). */
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  zoomInIcon: ZoomInIcon,
  zoomOutIcon: ZoomOutIcon,
  orientation = 'horizontal',
  className,
}: ZoomControlsProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: orientation === 'vertical' ? 'column' : 'row', gap: 4 }}
    >
      <Button variant="ghost" size="icon" title="Zoom in" onClick={onZoomIn}>
        <ZoomInIcon size={16} />
      </Button>
      <Button variant="ghost" size="icon" title="Zoom out" onClick={onZoomOut}>
        <ZoomOutIcon size={16} />
      </Button>
    </div>
  );
}
