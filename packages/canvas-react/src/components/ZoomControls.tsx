import type { ReactNode } from 'react';
import { Button } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import type { ToolbarIcon } from './types';
import { useZoom } from '../hooks/useZoom';

export interface ZoomControlsProps {
  zoomInIcon: ToolbarIcon;
  zoomOutIcon: ToolbarIcon;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  /**
   * Show a live `NN%` zoom readout between the two buttons, sourced from the
   * canvas via {@link useZoom}. Ignored when `zoomLevel` is also provided.
   * Default `false`.
   */
  showLevel?: boolean;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Manual zoom readout override rendered **between** the two buttons (e.g.
   * `'46%'`). Takes precedence over `showLevel`. Omit for a plain button pair.
   */
  zoomLevel?: ReactNode;
  className?: string;
}

/**
 * A pair of zoom-in / zoom-out icon buttons, optionally with a live zoom
 * readout between them. Self-wiring: hooks into the canvas via {@link useZoom}
 * — drop inside a `<Canvas>` and it works without any callback wiring.
 * Pass `onZoomIn` / `onZoomOut` to override the default hook-driven actions.
 */
export function ZoomControls({
  canvas,
  zoomInIcon: ZoomInIcon,
  zoomOutIcon: ZoomOutIcon,
  showLevel = false,
  orientation = 'horizontal',
  zoomLevel,
  className,
}: ZoomControlsProps) {
  const { zoom, zoomIn, zoomOut } = useZoom(canvas);
  const resolvedLevel = zoomLevel != null ? zoomLevel : showLevel ? `${Math.round(zoom * 100)}%` : undefined;
  const zoomInBtn = (
    <Button variant="ghost" size="icon" title="Zoom in" onClick={() => zoomIn()}>
      <ZoomInIcon size={16} />
    </Button>
  );
  const zoomOutBtn = (
    <Button variant="ghost" size="icon" title="Zoom out" onClick={() => zoomOut()}>
      <ZoomOutIcon size={16} />
    </Button>
  );
  const level =
    resolvedLevel != null ? (
      <span
        style={{
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          opacity: 0.8,
          textAlign: 'center',
          minWidth: 36,
        }}
      >
        {resolvedLevel}
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
          {zoomOutBtn}
          {level}
          {zoomInBtn}
        </>
      ) : (
        <>
          {zoomInBtn}
          {level}
          {zoomOutBtn}
        </>
      )}
    </div>
  );
}
