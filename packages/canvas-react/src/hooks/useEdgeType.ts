import { useCallback, useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphLayer, EdgePathType, EdgeShapeOptions } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

/**
 * Default path types surfaced by an edge-type picker, in display order. A
 * curated subset of {@link EdgePathType} that maps cleanly to the three common
 * routing styles plus their rounded/smooth orthogonal variants.
 */
export const DEFAULT_EDGE_TYPES: readonly EdgePathType[] = [
  'straight',
  'orth',
  'bezier',
  'rounded',
  'smooth',
];

/** Human labels for the built-in {@link EdgePathType} values (picker display). */
export const DEFAULT_EDGE_TYPE_LABELS: Record<string, string> = {
  straight: 'Straight',
  orth: 'Orthogonal',
  bezier: 'Curved',
  quadratic: 'Quadratic',
  rounded: 'Rounded',
  smooth: 'Smooth',
  manhattan: 'Manhattan',
  'bump-radial': 'Bump (radial)',
  'bump-horizontal': 'Bump (horizontal)',
  'step-radial': 'Step (radial)',
  bundle: 'Bundled',
};

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
 * (`setEdgeDefaults` replaces structured fields wholesale). State is owned by
 * the hook and seeded from `layer.edgeDefaults` on mount.
 */
export function useEdgeType(
  options: UseEdgeTypeOptions = {},
  canvas?: Canvas | null,
): UseEdgeTypeResult {
  const { layerId = 'graph', initial, types = DEFAULT_EDGE_TYPES, labels } = options;
  const resolved = useResolvedCanvas(canvas);
  const [edgeType, setEdgeTypeState] = useState<string>(initial ?? types[0] ?? 'straight');

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

  return { edgeType, edgeTypeOptions, setEdgeType };
}
