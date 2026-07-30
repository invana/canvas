import * as contour from '@invana/graph-layer-d3-contour';
import { useEffect, useMemo, useRef } from 'react';

import { useCanvas } from '../CanvasContext';

// The layer package's option type isn't re-exported as a value, so we mirror its
// shape via the constructor parameter to stay decoupled.
type FillLayerCtorOptions = ConstructorParameters<
  typeof contour.DensityContourFillLayer
>[0]['options'];

export interface DensityContourFillLayerProps
  extends Omit<FillLayerCtorOptions, 'graphLayerId'> {
  /** Layer id; default `'density'`. Changing this remounts the layer. */
  id?: string;
  /** Source `GraphLayer` id whose node positions feed the density estimate; default `'graph'`. */
  graphLayerId?: string;
  /**
   * Paint order. Default `-1` — behind the graph, so the bands sit under the
   * nodes they describe.
   */
  zIndex?: number;
  /**
   * Recompute the bands whenever a layout run settles. The density is derived
   * from node **positions**, and the layer's own `auto` recompute only listens
   * for `data:changed` — so without this the bands stay where the nodes started.
   * Default `true`; pass a layout id to react to just that one.
   */
  recomputeOnLayout?: boolean | string;
}

/**
 * Declarative wrapper for `@invana/graph-layer-d3-contour`
 * `DensityContourFillLayer` — filled iso-bands from a d3-contour density
 * estimate over a source `GraphLayer`'s node positions.
 *
 * Mount/unmount toggles the overlay — conditionally render it
 * (`{showDensity && <DensityContourFillLayer/>}`) to show/hide the bands.
 *
 * Reactive: appearance options (`bandwidth`, `thresholds`, `cellSize`,
 * `fillOpacity`, `palette`, `padding`) via `layer.setOptions(...)` + a
 * `recompute()`. `id`, `graphLayerId`, `zIndex` and `recomputeOnLayout` are
 * identity — changing any remounts.
 */
export function DensityContourFillLayer({
  id = 'density',
  graphLayerId = 'graph',
  zIndex = -1,
  recomputeOnLayout = true,
  ...options
}: DensityContourFillLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<contour.DensityContourFillLayer | null>(null);

  useEffect(() => {
    const layer = new contour.DensityContourFillLayer({
      id,
      zIndex,
      options: { graphLayerId, ...options } as FillLayerCtorOptions,
    });
    canvas.layers.add(layer);
    layerRef.current = layer;

    // Positions move without the data changing (every layout run), so refresh
    // the bands when a run settles. `layout:run:end` is the engine's bridged
    // lifecycle event — no layout instance to resolve, so JSX order is free.
    let offEnd: (() => void) | undefined;
    if (recomputeOnLayout) {
      offEnd = canvas.events.on('layout:run:end', ({ id: layoutId, reason }) => {
        // A cancelled run left the positions mid-flight — the superseding run
        // fires its own `'settled'`.
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
    layer.setOptions(options as Partial<FillLayerCtorOptions>);
    // `setOptions` only stores — the bands are painted geometry, so repaint.
    layer.recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return null;
}
