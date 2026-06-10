import { useCallback, useEffect, useRef, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphLayer } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

/** Minimal structural shape of a layout instance the hook can apply + stop. */
export interface ApplicableLayout {
  apply(layer: unknown): Promise<void> | void;
  stop?: () => void;
}

/** Factory producing a fresh layout instance per application. */
export type LayoutFactory = () => ApplicableLayout;

export interface UseLayoutOptions {
  /** Target `GraphLayer` id. Default `'graph'`. */
  layerId?: string;
  /** Padding for the post-layout `camera.fitContent`. Default `80`. */
  fitPadding?: number;
  /** Initially-selected key. Default: first key of `layouts`. */
  initial?: string;
  /** Optional key → human label map for the picker. Default: identity. */
  labels?: Record<string, string>;
  /** Apply the initial layout once the target layer is mounted. Default `true`. */
  applyInitial?: boolean;
}

export interface UseLayoutResult {
  /** Currently-applied layout key. */
  layout: string;
  /** Key → label map for a picker. */
  layoutOptions: Record<string, string>;
  /** Apply the layout registered under `key`, then fit the view. */
  applyLayout: (key: string) => void;
  /** True while a layout's `apply` promise is in flight. */
  isRunning: boolean;
}

/**
 * Imperative layout switching, lifting the common "instantiate → `apply(layer)`
 * → `camera.fitContent`" pattern into a hook. Layouts live in separate packages
 * (`@invana/graph-layout-*`) with no registry, so the consumer supplies a map of
 * **factories**; this hook can't be turnkey.
 *
 * Memoize the `layouts` map (module scope or `useMemo`) so `applyLayout` stays
 * stable across renders.
 */
export function useLayout(
  layouts: Record<string, LayoutFactory>,
  options: UseLayoutOptions = {},
  canvas?: Canvas | null,
): UseLayoutResult {
  const { layerId = 'graph', fitPadding = 80 } = options;
  const resolved = useResolvedCanvas(canvas);
  const keys = Object.keys(layouts);
  const [layout, setLayout] = useState(options.initial ?? keys[0] ?? '');
  const [isRunning, setRunning] = useState(false);
  const activeRef = useRef<ApplicableLayout | null>(null);

  const applyLayout = useCallback(
    (key: string) => {
      const factory = layouts[key];
      const layer = resolved.layers.get<GraphLayer>(layerId);
      if (!factory || !layer) return;
      activeRef.current?.stop?.();
      const instance = factory();
      activeRef.current = instance;
      setLayout(key);
      setRunning(true);
      Promise.resolve(instance.apply(layer))
        .then(() => {
          if (activeRef.current !== instance) return; // superseded by a newer apply
          resolved.camera.fitContent(layer.getBounds(), fitPadding);
          setRunning(false);
        })
        .catch(() => {
          if (activeRef.current === instance) setRunning(false);
        });
    },
    [layouts, resolved, layerId, fitPadding],
  );

  // Apply the initial layout once, as soon as the target layer is mounted.
  const didInit = useRef(false);
  const applyInitial = options.applyInitial ?? true;
  useEffect(() => {
    if (didInit.current || !applyInitial || !layout) return;
    if (!resolved.layers.has(layerId)) return; // retry on a later render
    didInit.current = true;
    applyLayout(layout);
  }, [resolved, layerId, layout, applyLayout, applyInitial]);

  const layoutOptions =
    options.labels ?? Object.fromEntries(keys.map((k) => [k, k]));

  return { layout, layoutOptions, applyLayout, isRunning };
}
