import { useEffect, useRef } from 'react';
import {
  GraphLayer as EngineGraphLayer,
  type GraphData,
  type GraphLayerOptions,
} from '@invana/graph';

import { useCanvas } from '../CanvasContext';

export interface GraphLayerProps extends Omit<GraphLayerOptions, 'store'> {
  /** Layer id; default `'graph'`. Changing this remounts the layer. */
  id?: string;
  /**
   * Graph data — nodes + edges. Reactive: when this prop changes the wrapper
   * calls `layer.setData(data)`, which clears and refills the store in one
   * batch. Pass `undefined` to skip the initial data load.
   */
  data?: GraphData;
  /**
   * Pre-built `GraphStore`. Forwarded to the engine layer. Init-only.
   */
  store?: GraphLayerOptions['store'];
}

/**
 * Declarative wrapper for `@invana/graph` `GraphLayer`.
 *
 * Init-only: `id`, `node`, `edge`, `useDefaultStates`, `store`, etc. — change
 * the `id` (or the component's `key`) to recreate with new options.
 *
 * Reactive: `data`. The wrapper calls `layer.setData(data)` whenever the
 * referenced `GraphData` object changes — make sure the prop is a stable
 * reference between renders unless you actually want a re-load.
 */
export function GraphLayer({ id = 'graph', data, store, ...rest }: GraphLayerProps) {
  const canvas = useCanvas();
  const layerRef = useRef<EngineGraphLayer | null>(null);

  useEffect(() => {
    const layer = new EngineGraphLayer({
      id,
      options: { ...(rest as GraphLayerOptions), ...(store ? { store } : {}) },
    });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas.layers.remove(id);
      layerRef.current = null;
    };
    // Other options are init-only; remount via `id` / `key` to change them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, id]);

  useEffect(() => {
    if (data && layerRef.current) {
      layerRef.current.setData(data);
    }
  }, [data]);

  return null;
}
