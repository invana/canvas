import * as contour from '@invana/graph-layer-d3-contour';
import { useEffect, useMemo, useRef } from 'react';

import { useCanvas } from '../CanvasContext';

// The layer package's option type isn't re-exported as a value, so we mirror its
// shape via the constructor parameter to stay decoupled.
type StrokeLayerCtorOptions = ConstructorParameters<
  typeof contour.DensityContourStrokeLayer
>[0]['options'];

export interface DensityContourStrokeLayerProps
  extends Omit<StrokeLayerCtorOptions, 'graphLayerId'> {
  /** Layer id; default `'density-stroke'`. Changing this remounts the layer. */
  id?: string;
  /** Source `GraphLayer` id whose node positions feed the density estimate; default `'graph'`. */
  graphLayerId?: string;
  /** Paint order. Default `-1` — behind the graph, like the fill variant. */
  zIndex?: number;
  /**
   * Recompute the iso-lines whenever a layout run settles. The density is
   * derived from node **positions**, and the layer's own `auto` recompute only
   * listens for `data:changed`. Default `true`; pass a layout id to react to
   * just that one.
   */
  recomputeOnLayout?: boolean | string;
}

/**
 * Declarative wrapper for `@invana/graph-layer-d3-contour`
 * `DensityContourStrokeLayer` — the stroked / Observable-style iso-lines of the
 * same density estimate. Compose it with `<DensityContourFillLayer>` (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 *
 * Reactive: appearance options via `layer.setOptions(...)` + a `recompute()`.
 * `id`, `graphLayerId`, `zIndex` and `recomputeOnLayout` are identity —
 * changing any remounts.
 */
export function DensityContourStrokeLayer({
  id = 'density-stroke',
  graphLayerId = 'graph',
  zIndex = -1,
  recomputeOnLayout = true,
  ...options
}: DensityContourStrokeLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<contour.DensityContourStrokeLayer | null>(null);

  useEffect(() => {
    const layer = new contour.DensityContourStrokeLayer({
      id,
      zIndex,
      options: { graphLayerId, ...options } as StrokeLayerCtorOptions,
    });
    canvas.layers.add(layer);
    layerRef.current = layer;

    // Same reasoning as the fill variant: positions move without the data
    // changing, so refresh on the engine's bridged layout-run lifecycle event.
    let offEnd: (() => void) | undefined;
    if (recomputeOnLayout) {
      offEnd = canvas.events.on('layout:run:end', ({ id: layoutId, reason }) => {
        if (reason !== 'settled') return;
        if (typeof recomputeOnLayout === 'string' && layoutId !== recomputeOnLayout) return;
        layerRef.current?.recompute();
      });
    }

    return () => {
      offEnd?.();
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Appearance options are applied reactively below; identity recreates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id, graphLayerId, zIndex, recomputeOnLayout]);

  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setOptions(options as Partial<StrokeLayerCtorOptions>);
    layer.recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
