import { createContext, useContext } from 'react';
import type { GraphCanvas } from '@invana/graph';

/**
 * Holds the initialised {@link GraphCanvas} for descendant wrappers/hooks. The
 * same instance is also provided on {@link CanvasContext} (typed as the base
 * `Canvas`) so existing wrappers keep working; this context is the graph-typed
 * view for `useGraphCanvas()` and the spec/config hooks.
 *
 * `<Canvas>` only renders children once the engine is ready, so the value
 * inside a descendant is always non-null.
 */
export const GraphCanvasContext = createContext<GraphCanvas | null>(null);

/**
 * Read the {@link GraphCanvas} from context. Throws when used outside a
 * `<Canvas>` so misuse fails loudly during render.
 */
export function useGraphCanvas(): GraphCanvas {
  const gc = useContext(GraphCanvasContext);
  if (!gc) {
    throw new Error('useGraphCanvas() must be called inside a <Canvas> component');
  }
  return gc;
}
