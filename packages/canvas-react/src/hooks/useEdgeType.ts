import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS } from '@invana/graph';
import type { GraphLayer, EdgePathType, EdgeShapeOptions } from '@invana/graph';

import { useCommandStates } from './useCommandStates';
import { useResolvedCanvas } from './useResolvedCanvas';

// The defaults live with the `graph.edgeType` command in `@invana/graph`;
// re-exported here so existing imports keep working.
export { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS };

export interface UseEdgeTypeOptions {
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /**
   * Initially-selected path type. When omitted, the hook seeds from the layer's
   * current `edgeDefaults.shape.pathType` on mount, falling back to the first
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
 * The prior `shape` is spread before patching so anchors / waypoints survive
 * (`setEdgeDefaults` replaces structured fields wholesale). On a `GraphCanvas`
 * it reads and writes through the `graph.edgeType` command (the value is the
 * layer's actual edge default); on a plain `Canvas` the hook owns the state,
 * seeded from `layer.edgeDefaults` on mount.
 */
export function useEdgeType(
  options: UseEdgeTypeOptions = {},
  canvas?: Canvas | null,
): UseEdgeTypeResult {
  const { layerId = 'graph', initial, types = DEFAULT_EDGE_TYPES, labels } = options;
  const resolved = useResolvedCanvas(canvas);
  const [edgeType, setEdgeTypeState] = useState<string>(initial ?? types[0] ?? 'straight');

  // On a `GraphCanvas` the `graph.edgeType` command is the source of truth —
  // the same one a saved control panel binds to — so this picker and a panel
  // stay in sync. A plain `Canvas` has no such command; fall back to the
  // hook-local state below.
  const args = useMemo(() => ({ layerId, types: [...types] }), [layerId, types]);
  const refs = useMemo(() => [{ command: 'graph.edgeType', args }], [args]);
  const { states, run } = useCommandStates(refs, resolved);
  const viaCommand = states[0]?.available === true;

  // Seed from the layer's current default once the canvas is resolved, unless an
  // explicit `initial` was given (the background layer emits no option event, so
  // the hook owns this state).
  useEffect(() => {
    if (initial) return;
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const current = layer?.edgeDefaults;
    const shape = current && typeof current === 'object' ? (current as { shape?: unknown }).shape : undefined;
    const pathType =
      shape && typeof shape === 'object' ? (shape as { pathType?: string }).pathType : undefined;
    if (pathType) setEdgeTypeState(pathType);
  }, [resolved, layerId, initial]);

  const setEdgeType = useCallback(
    (next: string) => {
      const layer = resolved.layers.get<GraphLayer>(layerId);
      if (!layer) return;
      // `setEdgeDefaults` replaces `shape` wholesale — spread the prior shape so
      // anchors / waypoints aren't dropped when only `pathType` changes.
      const prevShape = layer.edgeDefaults?.shape;
      const baseShape = (prevShape && typeof prevShape === 'object' ? prevShape : {}) as EdgeShapeOptions;
      const shape: EdgeShapeOptions = { ...baseShape, pathType: next as EdgePathType };
      layer.setEdgeDefaults({ shape });
      setEdgeTypeState(next);
    },
    [resolved, layerId],
  );

  const edgeTypeOptions =
    labels ?? Object.fromEntries(types.map((t) => [t, DEFAULT_EDGE_TYPE_LABELS[t] ?? t]));

  if (viaCommand) {
    return {
      edgeType: states[0]?.value ?? edgeType,
      edgeTypeOptions,
      setEdgeType: (next: string) => void run('graph.edgeType', { ...args, value: next }),
    };
  }
  return { edgeType, edgeTypeOptions, setEdgeType };
}
