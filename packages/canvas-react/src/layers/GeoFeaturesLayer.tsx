import * as maplibre from '@invana/graph-layer-maplibre';
import { useEffect, useMemo, useRef } from 'react';
import type { GeoFeaturesLayerOptions } from '@invana/graph-layer-maplibre';

import { useCanvas } from '../CanvasContext';

export interface GeoFeaturesLayerProps extends GeoFeaturesLayerOptions {
  /** Layer id; default `'geo-features'`. Changing this remounts the layer. */
  id?: string;
  /** Paint order. Default `5` — over a basemap, under markers. */
  zIndex?: number;
}

/**
 * Declarative wrapper for `@invana/graph-layer-maplibre` `GeoFeaturesLayer` —
 * areas, routes and radii from GeoJSON, drawn with pixel-constant strokes and
 * labels. Renders nothing.
 *
 * Under a `<MapLayer>`, pass its id as `mapLayerId` so clicks and hovers reach the
 * features; add this layer *after* the map. `features`, `defaults`, labels and the
 * unconfirmed rule are reactive; `id`, `zIndex` and `mapLayerId` are identity.
 */
export function GeoFeaturesLayer({ id = 'geo-features', zIndex = 5, mapLayerId, ...options }: GeoFeaturesLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<maplibre.GeoFeaturesLayer | null>(null);

  useEffect(() => {
    const layer = new maplibre.GeoFeaturesLayer({ id, zIndex, options: { ...options, mapLayerId } });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Settings are applied reactively below; identity recreates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, zIndex, mapLayerId]);

  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
