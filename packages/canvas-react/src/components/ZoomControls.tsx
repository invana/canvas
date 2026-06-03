import type { ReactNode } from 'react';
import { Button } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomInIcon: ToolbarIcon;
  zoomOutIcon: ToolbarIcon;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Optional live zoom readout rendered **between** the two buttons (e.g.
   * `'46%'`) — the React-Flow zoom-slider layout. Convention: horizontal reads
   * `−  level  +` (zoom-out on the left); vertical reads `+  level  −` (zoom-in
   * on top). Omit for a plain button pair.
   */
  zoomLevel?: ReactNode;
  className?: string;
}

/**
 * A pair of zoom-in / zoom-out icon buttons, optionally with a live zoom
 * readout between them ({@link ZoomControlsProps.zoomLevel}). Engine-agnostic
 * (callbacks only).
 */
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  zoomInIcon: ZoomInIcon,
  zoomOutIcon: ZoomOutIcon,
  orientation = 'horizontal',
  zoomLevel,
  className,
}: ZoomControlsProps) {
  const zoomIn = (
    <Button variant="ghost" size="icon" title="Zoom in" onClick={onZoomIn}>
      <ZoomInIcon size={16} />
    </Button>
  );
  const zoomOut = (
    <Button variant="ghost" size="icon" title="Zoom out" onClick={onZoomOut}>
      <ZoomOutIcon size={16} />
    </Button>
  );
  const level =
    zoomLevel != null ? (
      <span
        style={{
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          opacity: 0.8,
          textAlign: 'center',
          minWidth: 36,
        }}
      >
        {zoomLevel}
      </span>
    ) : null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Horizontal: −  level  + · Vertical: +  level  −  (zoom-in leads). */}
      {orientation === 'horizontal' ? (
        <>
          {zoomOut}
          {level}
          {zoomIn}
        </>
      ) : (
        <>
          {zoomIn}
          {level}
          {zoomOut}
        </>
      )}
    </div>
  );
}
