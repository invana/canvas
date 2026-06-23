import { useEffect, useMemo, useRef } from 'react';
// Concatenated package-prefix alias (not a `* as canvas` namespace) because the
// `canvas` engine instance from `useCanvas()` already owns that name here.
import { DevInfoLayer as CanvasDevInfoLayer, type DevInfoLayerOptions } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

export interface DevInfoLayerProps extends DevInfoLayerOptions {
  /** Layer id; default `'dev-info'`. Changing this remounts the layer. */
  id?: string;
  /** Pixi z-index inside the screen stage. Default `9999` (top). Init-only. */
  zIndex?: number;
}

/**
 * Declarative wrapper for `@invana/canvas` `DevInfoLayer` — the screen-fixed
 * dev overlay (FPS, pointer screen/world coords, camera zoom).
 *
 * Reactive: style options (`corner`, `fontSize`, `opacity`, `backgroundColor`,
 * `textColor`, `accentColor`, `enabled`) apply in place via `setOptions(...)`.
 * Only `id` / `zIndex` force a remount.
 */
export function DevInfoLayer({ id = 'dev-info', zIndex, ...options }: DevInfoLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<CanvasDevInfoLayer | null>(null);

  useEffect(() => {
    const layer = new CanvasDevInfoLayer({ id, zIndex, ...options });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Options are applied reactively below; only `id` / `zIndex` recreate it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, zIndex]);

  // Re-apply options whenever any value changes. Keyed on a serialised
  // snapshot so a new-but-equal `options` object doesn't trigger a re-render.
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
