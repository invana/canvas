import type { Canvas } from '@invana/canvas';
import type {
  GraphLayer,
  GraphNode,
  GraphEdge,
  GraphStore,
  ClickViewBehaviour,
} from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useViewData, type UseViewDataOptions } from './useViewData';

/**
 * The full "info" handed to a custom viewer UI (the `panel` render-prop on
 * `<ClickViewBehaviour>`). It bundles the **resolved display fields** (from
 * {@link useViewData}), the **raw stored entity**, and **engine handles** so the
 * UI can do anything — render read-only details (visualiser) or a form editor
 * that commits through the store / history (modeller).
 *
 * `kind` is `'node' | 'edge'` today; it's intentionally the discriminator the
 * UI switches on, so new clickable data types can widen this union later without
 * changing the contract.
 */
export interface ViewContext {
  kind: 'node' | 'edge';
  id: string;
  /** Raw stored node — present when `kind === 'node'`. */
  node?: GraphNode;
  /** Raw stored edge — present when `kind === 'edge'`. */
  edge?: GraphEdge;
  /** Effective (resolved) label text. Empty for edges. */
  label: string;
  /** The element's free-form `type` tag, when set. */
  type?: string;
  /** Current `data` as a flat string map. */
  data: Record<string, string>;
  /** Source node id — edges only. */
  source?: string;
  /** Target node id — edges only. */
  target?: string;
  /** The resolved engine canvas. */
  canvas: Canvas;
  /** The target `GraphLayer`. */
  layer: GraphLayer;
  /** The layer's store — write here (spread prior `style`) to edit. */
  store: GraphStore;
  /** Dismiss the viewer (clears the `ClickViewBehaviour` target). */
  close: () => void;
}

/**
 * Resolves the single clicked node/edge to a full {@link ViewContext} — the
 * read-only display fields ({@link useViewData}) plus the raw entity and engine
 * handles — or `null` when nothing is targeted. This is what a custom viewer UI
 * receives; see `<ClickViewBehaviour panel={…}>`.
 */
export function useViewContext(
  options: UseViewDataOptions = {},
  canvas?: Canvas | null,
): ViewContext | null {
  const { layerId = 'graph', viewId = 'click-view' } = options;
  const resolved = useResolvedCanvas(canvas);
  const data = useViewData(options, canvas);
  if (!data) return null;

  const layer = resolved.layers.get<GraphLayer>(layerId);
  if (!layer) return null;
  const store = layer.store;
  const close = (): void => resolved.behaviours.get<ClickViewBehaviour>(viewId)?.clear();

  const ctx: ViewContext = { ...data, canvas: resolved, layer, store, close };
  if (data.kind === 'node') {
    const node = store.getNode(data.id);
    if (node) ctx.node = node;
  } else {
    const edge = store.getEdge(data.id);
    if (edge) ctx.edge = edge;
  }
  return ctx;
}
