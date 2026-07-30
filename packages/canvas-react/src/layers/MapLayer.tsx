import * as maplibre from '@invana/graph-layer-maplibre';
import { useEffect, useMemo, useRef } from 'react';
import type { MapLayerOptions } from '@invana/graph-layer-maplibre';

import { useCanvas } from '../CanvasContext';

export interface MapLayerProps extends MapLayerOptions {
  /** Layer id; default `'map'`. Changing this remounts the layer. */
  id?: string;
  /**
   * Paint order. Default `-100` — the basemap sits under every domain layer.
   * (The MapLibre canvas itself lives *below* the Pixi canvas in the DOM; the
   * `zIndex` orders this layer against other engine layers.)
   */
  zIndex?: number;
}

/**
 * Declarative wrapper for `@invana/graph-layer-maplibre` `MapLayer` — a MapLibre
 * GL basemap under the canvas, whose camera the engine mirrors every frame.
 *
 * MapLibre owns pan / zoom, so **don't** also mount `<DragPanBehaviour>` /
 * `<WheelZoomBehaviour>` — the two camera drivers fight. Inside
 * `<GraphCanvasApp>` that means `bundle={false}` (the bundle registers both).
 *
 * Pin node positions with the package's standalone `projectLngLat([lng, lat])`
 * — the same mercator math as `layer.project(...)`, callable while shaping
 * `data`, before any layer exists.
 *
 * Reactive: `styleUrl` / `center` / `zoom` / the rest of `MapLayerOptions` via
 * `layer.setOptions(...)`. `id` and `zIndex` are identity — changing either
 * remounts (and rebuilds the map).
 */
export function MapLayer({ id = 'map', zIndex = -100, ...options }: MapLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<maplibre.MapLayer | null>(null);

  useEffect(() => {
    const layer = new maplibre.MapLayer({ id, zIndex, options });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Appearance options are applied reactively below; identity recreates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, zIndex]);

  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
