import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';

import { useCamera } from './useCamera';
import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseZoomResult {
  /** Live uniform scale — re-renders whenever the camera zooms (interactively or programmatically). */
  zoom: number;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  setZoom: (scale: number) => void;
  zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
}

/**
 * Live zoom state + zoom actions for the resolved canvas. Subscribes to
 * `camera:zoom`, so the returned `zoom` tracks wheel / pinch / programmatic
 * zoom and re-renders the component.
 *
 * Multi-canvas-safe: the subscription effect is keyed on the resolved instance,
 * so two `<Canvas>` trees (or two explicit instances) never share zoom state.
 *
 * @param canvas Optional explicit instance; defaults to the context canvas.
 */
export function useZoom(canvas?: Canvas | null): UseZoomResult {
  const resolved = useResolvedCanvas(canvas);
  const { zoomIn, zoomOut, setZoom, zoomTo } = useCamera(resolved);
  const [zoom, setZoomState] = useState(() => resolved.camera.scale);

  useEffect(() => {
    // Resync immediately in case the resolved instance changed under us.
    setZoomState(resolved.camera.scale);
    return resolved.events.on('input:camera:zoom', ({ scale }) => setZoomState(scale));
  }, [resolved]);

  return { zoom, zoomIn, zoomOut, setZoom, zoomTo };
}
