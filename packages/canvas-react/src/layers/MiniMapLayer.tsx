import { useEffect, useMemo, useRef } from 'react';
import { MiniMapLayer as EngineMiniMapLayer, type MiniMapLayerOptions } from '@invana/graph';

import { useCanvas } from '../CanvasContext';

export interface MiniMapLayerProps extends Omit<MiniMapLayerOptions, 'graphLayerId'> {
  /** Layer id; default `'minimap'`. Changing this remounts the layer. */
  id?: string;
  /** Source `GraphLayer` id this minimap mirrors; default `'graph'`. */
  graphLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `MiniMapLayer`.
 *
 * Mount/unmount toggles visibility — conditionally render this component
 * (`{showMinimap && <MiniMapLayer/>}`) to show/hide the minimap.
 *
 * Reactive: appearance options (size, colours, viewport indicator, position,
 * margin) via `layer.setOptions(...)`. `id` and `graphLayerId` are identity —
 * changing either remounts.
 */
export function MiniMapLayer({
  id = 'minimap',
  graphLayerId = 'graph',
  ...options
}: MiniMapLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<EngineMiniMapLayer | null>(null);

  useEffect(() => {
    const layer = new EngineMiniMapLayer({ id, options: { graphLayerId, ...options } });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Appearance options are applied reactively below; identity recreates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, graphLayerId]);

  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
