import { useEffect, useMemo, useRef } from 'react';
// Concatenated package-prefix alias (not a `* as canvas` namespace) because the
// `canvas` engine instance from `useCanvas()` already owns that name here.
import { BackgroundLayer as CanvasBackgroundLayer, type BackgroundLayerOptions } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

export interface BackgroundLayerProps extends BackgroundLayerOptions {
  /** Layer id; default `'background'`. Changing this remounts the layer. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `BackgroundLayer`.
 *
 * Reactive: all style options (`type`, `patternType`, `color`,
 * `backgroundColor`, `size`, `spacing`, `alpha`, `followCamera`, `mode`) — a
 * change calls `layer.setOptions(...)` and re-renders in place (no remount).
 * Only `id` forces a remount.
 */
export function BackgroundLayer({ id = 'background', ...options }: BackgroundLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<CanvasBackgroundLayer | null>(null);

  useEffect(() => {
    const layer = new CanvasBackgroundLayer({ id, options });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Options are applied reactively below; only `id` recreates the layer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id]);

  // Re-apply options whenever any value changes. Keyed on a serialised
  // snapshot so a new-but-equal `options` object doesn't trigger a re-render.
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
