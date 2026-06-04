import { useContext } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import type {
  GraphLayer as EngineGraphLayer,
  GraphEdge,
  GraphNode,
  EdgeStyle,
  NodeStyle,
} from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useSelection } from './useSelection';
import { HistoryContext } from '../HistoryContext';
import type { PropertiesEditorValues } from '../components/PropertiesEditor';

export interface UseEntityEditorOptions {
  /** GraphLayer to read/write. Default `'graph'`. */
  layerId?: string;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
}

/** The single selected node/edge, its current label + data, and a commit action. */
export interface EntityEditorTarget {
  kind: 'node' | 'edge';
  id: string;
  /** Effective (resolved) label text. */
  label: string;
  /** Current `data` as a flat string map (non-string values are stringified). */
  data: Record<string, string>;
  /**
   * Write the edited label + data back to the store. Undoable as one entry when
   * a `<GraphHistoryProvider>` is present, a direct mutation otherwise. Spreads
   * the element's prior per-node/per-edge `style` and overwrites `labelText`, and
   * replaces `data` wholesale.
   */
  commit: (values: PropertiesEditorValues) => void;
}

/** Coerce an opaque `data` payload into the flat string map the editor edits. */
function toStringMap(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  return out;
}

/**
 * Selection-driven property editing for an inspector. Returns the **single**
 * selected node or edge — its effective label + `data` and a `commit` that
 * writes edits back undoably — or `null` when the selection isn't exactly one
 * element (so a panel can render nothing). Reads the selection via
 * {@link useSelection} (needs a `ClickSelectBehaviour`); commits via the
 * `GraphHistory` from a `<GraphHistoryProvider>` ancestor when present.
 *
 * The view (`<PropertiesEditor>`) and placement (`<Panel>`) are the consumer's —
 * see {@link InspectorPanel} for the turnkey wiring.
 */
export function useEntityEditor(
  options: UseEntityEditorOptions = {},
  canvas?: EngineCanvas | null,
): EntityEditorTarget | null {
  const { layerId = 'graph', clickSelectId = 'click-select' } = options;
  const resolved = useResolvedCanvas(canvas);
  const history = useContext(HistoryContext);
  const { selectedNodeIds, selectedEdgeIds } = useSelection({ clickSelectId }, canvas);

  // Exactly one element (a node XOR an edge) — otherwise there's nothing single
  // to inspect.
  const single =
    selectedNodeIds.length === 1 && selectedEdgeIds.length === 0
      ? ({ kind: 'node', id: selectedNodeIds[0]! } as const)
      : selectedEdgeIds.length === 1 && selectedNodeIds.length === 0
        ? ({ kind: 'edge', id: selectedEdgeIds[0]! } as const)
        : null;
  if (!single) return null;

  const layer = resolved.layers.get<EngineGraphLayer>(layerId);
  const store = layer?.store;
  if (!layer || !store) return null;

  if (single.kind === 'node') {
    const node = store.getNode(single.id);
    if (!node) return null;
    const label = (layer.resolveNodeStyle(node).labelText as string | undefined) ?? '';
    const commit = ({ label: nextLabel, data }: PropertiesEditorValues): void => {
      const prior = (node.style ?? {}) as Partial<NodeStyle>;
      const patch: Partial<GraphNode> = { style: { ...prior, labelText: nextLabel }, data };
      if (history) history.transaction('edit node', (rec) => rec.updateNode(single.id, patch));
      else store.updateNode(single.id, patch);
    };
    return { kind: 'node', id: single.id, label, data: toStringMap(node.data), commit };
  }

  const edge = store.getEdge(single.id);
  if (!edge) return null;
  const label = (layer.resolveEdgeStyle(edge).labelText as string | undefined) ?? '';
  const commit = ({ label: nextLabel, data }: PropertiesEditorValues): void => {
    const prior = (edge.style ?? {}) as Partial<EdgeStyle>;
    const patch: Partial<GraphEdge> = { style: { ...prior, labelText: nextLabel }, data };
    if (history) history.transaction('edit edge', (rec) => rec.updateEdge(single.id, patch));
    else store.updateEdge(single.id, patch);
  };
  return { kind: 'edge', id: single.id, label, data: toStringMap(edge.data), commit };
}
