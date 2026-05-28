import { useCallback, useEffect, useState } from 'react';
import type { Canvas as EngineCanvas, Rect } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/** Default padding (screen px) around the fitted content. */
const DEFAULT_FIT_PADDING = 80;

/** Structural shape of a world layer that can report its content bounds. */
interface BoundedLayer {
  getBounds(): Rect;
}

function hasGetBounds(layer: unknown): layer is BoundedLayer {
  return typeof (layer as BoundedLayer | undefined)?.getBounds === 'function';
}

export interface UseFitContentResult {
  /** Fit the viewport to the target layer's content bounds. No-op until the layer exists. */
  fitContent: (padding?: number) => void;
  /** Whether the target layer is currently mounted (drives e.g. button disabled state). */
  hasContent: boolean;
}

/**
 * Fit-to-content (zoom-to-extent) for a specific layer on the resolved canvas.
 * The layer is resolved lazily *inside* the returned callback, so the hook
 * tolerates the layer mounting after the hook runs (common, since layer
 * wrappers register in effects). `hasContent` tracks layer mount/unmount via
 * the `layer:added` / `layer:removed` canvas events.
 *
 * @param layerId Target layer id (e.g. `'graph'`).
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
export function useFitContent(
  layerId: string,
  canvas?: EngineCanvas | null,
): UseFitContentResult {
  const resolved = useResolvedCanvas(canvas);
  const [hasContent, setHasContent] = useState(() => resolved.layers.has(layerId));

  useEffect(() => {
    const sync = () => setHasContent(resolved.layers.has(layerId));
    sync();
    const offAdded = resolved.events.on('layer:added', sync);
    const offRemoved = resolved.events.on('layer:removed', sync);
    return () => {
      offAdded();
      offRemoved();
    };
  }, [resolved, layerId]);

  const fitContent = useCallback(
    (padding = DEFAULT_FIT_PADDING) => {
      const layer = resolved.layers.get(layerId);
      if (hasGetBounds(layer)) {
        resolved.camera.fitContent(layer.getBounds(), padding);
      }
    },
    [resolved, layerId],
  );

  return { fitContent, hasContent };
}
