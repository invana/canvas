import { useEffect, useState, type ReactNode } from 'react';
import { GraphHistory, type GraphLayer as EngineGraphLayer } from '@invana/graph';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useResolvedCanvas } from '../hooks/useResolvedCanvas';
import { HistoryContext } from '../HistoryContext';

export interface GraphHistoryProviderProps {
  /** Id of the `GraphLayer` whose store the history journals. Default `'graph'`. */
  layerId?: string;
  /** Maximum undo depth. Forwarded to `GraphHistory`. Default `100`. */
  limit?: number;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  children?: ReactNode;
}

/**
 * Constructs a `GraphHistory` over the target layer's store and provides it via
 * {@link HistoryContext}. Place it **inside** `<Canvas>` and **after** the
 * `<GraphLayer>` it targets, so the layer (and its store) exist when the effect
 * runs. Descendant `useHistory` / Undo-Redo-Redraw buttons resolve the history
 * from here.
 *
 * The history is rebuilt (and its stacks cleared) if `layerId`, `limit`, or the
 * resolved canvas change.
 */
export function GraphHistoryProvider({
  layerId = 'graph',
  limit,
  canvas,
  children,
}: GraphHistoryProviderProps) {
  const resolved = useResolvedCanvas(canvas);
  const [history, setHistory] = useState<GraphHistory | null>(null);

  useEffect(() => {
    const layer = resolved.layers.get<EngineGraphLayer>(layerId);
    const store = layer?.store;
    if (!store) return;
    const instance = new GraphHistory(store, limit !== undefined ? { limit } : {});
    setHistory(instance);
    return () => {
      instance.clear();
      setHistory(null);
    };
  }, [resolved, layerId, limit]);

  return <HistoryContext.Provider value={history}>{children}</HistoryContext.Provider>;
}
