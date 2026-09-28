import { useCallback, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';
import { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS, edgePathType, setEdgePathType } from '@invana/graph';
import type { GraphLayer, EdgePathType } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

// The defaults live with the `graph.edgeType` command in `@invana/graph`;
// re-exported here so existing imports keep working.
export { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS };

export interface UseEdgeTypeOptions {
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /**
   * The path type shown while the layer's edge template sets none. The layer's
   * own `edgeDefaults.shape.pathType` always wins; without either, the first
   * entry of `types`.
   */
  initial?: EdgePathType;
  /** Path types to expose, in order. Default {@link DEFAULT_EDGE_TYPES}. */
  types?: readonly EdgePathType[];
  /** Optional key → human label map. Default {@link DEFAULT_EDGE_TYPE_LABELS}. */
  labels?: Record<string, string>;
}

export interface UseEdgeTypeResult {
  /** Currently-selected path type key. */
  edgeType: string;
  /** Key → label map for a picker. */
  edgeTypeOptions: Record<string, string>;
  /**
   * Switch the path type for **every** edge in the layer and make it the
   * default for future edges (via `GraphLayer.setEdgeDefaults`).
   */
  setEdgeType: (type: string) => void;
}

/**
 * Layer-wide edge routing switch. Patches the `GraphLayer` edge template
 * (`options.edge.style.shape.pathType`) via {@link GraphLayer.setEdgeDefaults},
 * which re-renders every edge and becomes the default for edges added later —
 * the engine-side `pathType` shorthand resolves to the right router + pathStyle
 * pair (e.g. `'orth'`, `'bezier'`, `'rounded'`).
 *
 * The rule is `@invana/graph`'s `edgePathType` / `setEdgePathType` — the same
 * functions the `graph.edgeType` command calls — so on any canvas (a
 * `GraphCanvas` or a plain `Canvas` holding a `GraphLayer`) this picker and a
 * saved panel agree. `edgeType` is the layer's actual path type, re-read on the
 * layer's `style:changed`, so it follows every writer; `initial` (then the
 * first of `types`) only fills in while the layer sets none.
 */
export function useEdgeType(
  options: UseEdgeTypeOptions = {},
  canvas?: Canvas | null,
): UseEdgeTypeResult {
  const { layerId = 'graph', initial, types = DEFAULT_EDGE_TYPES, labels } = options;
  const resolved = useResolvedCanvas(canvas);

  // The layer's own path type; re-read when its template changes or the layer
  // itself comes / goes.
  const subscribe = useCallback(
    (onChange: () => void) => {
      let offStyle: (() => void) | undefined;
      const attach = () => {
        offStyle?.();
        offStyle = resolved.layers.get<GraphLayer>(layerId)?.events.on('style:changed', onChange);
        onChange();
      };
      attach();
      const offAdd = resolved.events.on('scene:layer:add', ({ id }) => {
        if (id === layerId) attach();
      });
      const offRemove = resolved.events.on('scene:layer:remove', ({ id }) => {
        if (id === layerId) attach();
      });
      return () => {
        offStyle?.();
        offAdd();
        offRemove();
      };
    },
    [resolved, layerId],
  );
  const read = useCallback(() => {
    const layer = resolved.layers.get<GraphLayer>(layerId);
    return (layer ? edgePathType(layer) : undefined) ?? null;
  }, [resolved, layerId]);
  const current = useSyncExternalStore(subscribe, read, read);

  const setEdgeType = useCallback(
    (next: string) => {
      const layer = resolved.layers.get<GraphLayer>(layerId);
      if (layer) setEdgePathType(layer, next);
    },
    [resolved, layerId],
  );

  const edgeTypeOptions =
    labels ?? Object.fromEntries(types.map((t) => [t, DEFAULT_EDGE_TYPE_LABELS[t] ?? t]));

  return { edgeType: current ?? initial ?? types[0] ?? 'straight', edgeTypeOptions, setEdgeType };
}
