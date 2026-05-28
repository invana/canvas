import { useMemo } from 'react';
import type { Canvas as EngineCanvas, Rect } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/** Default multiplicative step for one zoom-in / zoom-out tick. */
const DEFAULT_ZOOM_STEP = 1.2;

export interface UseCameraResult {
  /** Multiply scale by `factor` (default 1.2), anchored at the viewport centre. */
  zoomIn: (factor?: number) => void;
  /** Divide scale by `factor` (default 1.2), anchored at the viewport centre. */
  zoomOut: (factor?: number) => void;
  /** Set an absolute scale, anchored at the viewport centre. */
  setZoom: (scale: number) => void;
  /** Set an absolute scale around an arbitrary screen point (defaults to centre). */
  zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
  /** Pan by `(dx, dy)` screen pixels. */
  pan: (dx: number, dy: number) => void;
  /** Fit a world-space rectangle into the viewport. */
  fitContent: (worldRect: Rect, padding?: number) => void;
  /** Read the current uniform scale (does not subscribe — use `useZoom` for live state). */
  getZoom: () => number;
}

/**
 * Imperative camera actions for the resolved canvas — the wiring the
 * GraphVisualiser story used to hand-write inline (`camera.zoomAt(1.2)` etc.),
 * promoted to a reusable, multi-canvas-safe hook. Pure actions, no
 * subscriptions; callbacks are stable per resolved `canvas`. For a live zoom
 * value that re-renders, use {@link useZoom}.
 *
 * @param canvas Optional explicit instance; defaults to the context canvas.
 */
export function useCamera(canvas?: EngineCanvas | null): UseCameraResult {
  const resolved = useResolvedCanvas(canvas);

  return useMemo<UseCameraResult>(() => {
    const camera = resolved.camera;
    return {
      zoomIn: (factor = DEFAULT_ZOOM_STEP) => camera.zoomAt(factor),
      zoomOut: (factor = DEFAULT_ZOOM_STEP) => camera.zoomAt(1 / factor),
      setZoom: (scale) => camera.setZoom(scale),
      zoomTo: (scale, centerX, centerY) =>
        camera.zoomAt(scale / camera.scale, centerX, centerY),
      pan: (dx, dy) => camera.pan(dx, dy),
      fitContent: (worldRect, padding) => camera.fitContent(worldRect, padding),
      getZoom: () => camera.scale,
    };
  }, [resolved]);
}
