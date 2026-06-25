import type { Canvas } from '@invana/canvas';
import type { GraphLayer } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useViewTarget } from './useViewTarget';

export interface UseViewDataOptions {
  /** GraphLayer to read from. Default `'graph'`. */
  layerId?: string;
  /** Id of the `ClickViewBehaviour` the view target is read from. Default `'click-view'`. */
  viewId?: string;
}

/** The single viewed node/edge resolved to its display fields. Read-only. */
export interface ViewData {
  kind: 'node' | 'edge';
  id: string;
  /** Effective (resolved) label text. Empty for edges (they have no label field). */
  label: string;
  /** The element's free-form `type` tag, when set. */
  type?: string;
  /**
   * Current `data` as a flat map. Values keep their original type (number,
   * string, array, object, …) so a viewer can render each property by kind —
   * `null` / `undefined` entries are dropped. See `PropertyDetailView`.
   */
  data: Record<string, unknown>;
  /** Source node id — edges only. */
  source?: string;
  /** Target node id — edges only. */
  target?: string;
}

/**
 * Shallow-copy an opaque `data` payload into a flat display map, **preserving
 * each value's type** (only `null` / `undefined` entries are dropped). Type is
 * kept — not stringified — so a viewer can render numbers, arrays, objects, and
 * URLs differently. Contrast the editor path's `toStringMap`, which flattens to
 * strings for text inputs.
 */
function toDisplayMap(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Click-driven, **read-only** property data for a viewer. Returns the single
 * node or edge the user clicked to view — its effective label, `type`, `data`
 * (and, for edges, `source`/`target`) — or `null` when nothing is targeted (so
 * a panel can render nothing). Reads the target via {@link useViewTarget} (needs
 * a `ClickViewBehaviour`, independent of selection).
 *
 * The read-only analogue of {@link useEntityEditor}: no `commit` — it never
 * writes to the store. The view (`<PropertyDetailView>`) and placement are the
 * consumer's — see `NodeDetailView` / `EdgeDetailView` for the turnkey wiring.
 */
export function useViewData(
  options: UseViewDataOptions = {},
  canvas?: Canvas | null,
): ViewData | null {
  const { layerId = 'graph', viewId = 'click-view' } = options;
  const resolved = useResolvedCanvas(canvas);
  const single = useViewTarget({ viewId }, canvas);
  if (!single) return null;

  const layer = resolved.layers.get<GraphLayer>(layerId);
  const store = layer?.store;
  if (!layer || !store) return null;

  if (single.kind === 'node') {
    const node = store.getNode(single.id);
    if (!node) return null;
    const label = (layer.resolveNodeStyle(node).labelText as string | undefined) ?? '';
    const result: ViewData = { kind: 'node', id: single.id, label, data: toDisplayMap(node.data) };
    const type = node.type as string | undefined;
    if (type) result.type = type;
    return result;
  }

  const edge = store.getEdge(single.id);
  if (!edge) return null;
  // Resolve the edge's drawn label (`labelText`) the same way nodes do — edges
  // can carry one too; it was previously hardcoded empty.
  const label = (layer.resolveEdgeStyle(edge).labelText as string | undefined) ?? '';
  const result: ViewData = {
    kind: 'edge',
    id: single.id,
    label,
    data: toDisplayMap(edge.data),
    source: edge.source,
    target: edge.target,
  };
  const type = edge.type as string | undefined;
  if (type) result.type = type;
  return result;
}
