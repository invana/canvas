import { useContext } from 'react';
import type { Canvas } from '@invana/canvas';
import type {
  GraphLayer,
  GraphEdge,
  GraphNode,
  EdgeStyle,
  NodeStyle,
} from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useInspectTarget } from './useInspectTarget';
import { HistoryContext } from '../HistoryContext';
import type { PropertiesEditorValues } from '../components/PropertiesEditor';

export interface UseEntityEditorOptions {
  /** GraphLayer to read/write. Default `'graph'`. */
  layerId?: string;
  /** Id of the `ClickInspectBehaviour` the edit target is read from. Default `'click-inspect'`. */
  inspectId?: string;
  /**
   * Modeller mode: edit a single `type` field on **both** nodes and edges whose
   * value also drives the displayed label (mirrored to `style.labelText`) — in a
   * modeller the type *is* what's drawn on the element. Off by default, in which
   * case nodes edit their `label` (`style.labelText`) and edges edit their `type`,
   * each as a separate field.
   */
  typeAsLabel?: boolean;
}

/** The single selected node/edge, its current label + data, and a commit action. */
export interface EntityEditorTarget {
  kind: 'node' | 'edge';
  id: string;
  /** Effective (resolved) label text. Empty for edges (they have no label field). */
  label: string;
  /** The element's free-form `type` tag. Present for edges (`'' ` when unset). */
  type?: string;
  /** Current `data` as a flat string map (non-string values are stringified). */
  data: Record<string, string>;
  /**
   * Write the editor's values back to the store, undoable as one entry when a
   * `<GraphHistoryProvider>` is present (a direct mutation otherwise). Replaces
   * `data` wholesale. A **node** also overwrites `style.labelText` (spreading the
   * prior style); an **edge** writes its `type` instead — edges have no label.
   */
  commit: (values: PropertiesEditorValues) => void;
  /**
   * Swap an edge's `source`/`target` (reverse its direction). Present only for
   * edges; undoable as one entry when a `<GraphHistoryProvider>` is present.
   */
  reverse?: () => void;
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
 * Click-driven property editing for an inspector. Returns the **single** node or
 * edge the user clicked to edit — its effective label + `data` and a `commit`
 * that writes edits back undoably — or `null` when nothing is targeted (so a
 * panel can render nothing). Reads the target via {@link useInspectTarget}
 * (needs a `ClickInspectBehaviour`, independent of selection); commits via the
 * `GraphHistory` from a `<GraphHistoryProvider>` ancestor when present.
 *
 * The view (`<PropertiesEditor>`) and placement (`<Panel>`) are the consumer's —
 * see {@link InspectorPanel} for the turnkey wiring.
 */
export function useEntityEditor(
  options: UseEntityEditorOptions = {},
  canvas?: Canvas | null,
): EntityEditorTarget | null {
  const { layerId = 'graph', inspectId = 'click-inspect', typeAsLabel = false } = options;
  const resolved = useResolvedCanvas(canvas);
  const history = useContext(HistoryContext);
  const single = useInspectTarget({ inspectId }, canvas);
  if (!single) return null;

  const layer = resolved.layers.get<GraphLayer>(layerId);
  const store = layer?.store;
  if (!layer || !store) return null;

  if (single.kind === 'node') {
    const node = store.getNode(single.id);
    if (!node) return null;
    const label = (layer.resolveNodeStyle(node).labelText as string | undefined) ?? '';

    if (typeAsLabel) {
      // One `type` field, mirrored to the displayed `labelText`. Seed it from the
      // node's `type`, falling back to its current label so existing text shows.
      const type = (node.type as string | undefined) ?? label;
      const commit = ({ type: nextType, data }: PropertiesEditorValues): void => {
        const value = nextType ?? '';
        const prior = (node.style ?? {}) as Partial<NodeStyle>;
        const patch: Partial<GraphNode> = { type: value, style: { ...prior, labelText: value }, data };
        if (history) history.transaction('edit node', (rec) => rec.updateNode(single.id, patch));
        else store.updateNode(single.id, patch);
      };
      return { kind: 'node', id: single.id, label: '', type, data: toStringMap(node.data), commit };
    }

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
  // Edges are identified by their `type` (predicate), not a `label`. In
  // `typeAsLabel` mode the type also drives the drawn label (`style.labelText`);
  // otherwise the edge inspector edits `type` + `data` only.
  const edgeLabel = (layer.resolveEdgeStyle(edge).labelText as string | undefined) ?? '';
  const type = (edge.type as string | undefined) ?? (typeAsLabel ? edgeLabel : '');
  const commit = ({ type: nextType, data }: PropertiesEditorValues): void => {
    const value = nextType ?? '';
    const patch: Partial<GraphEdge> = { data };
    if (nextType !== undefined) patch.type = value;
    if (typeAsLabel) {
      const prior = (edge.style ?? {}) as Partial<EdgeStyle>;
      patch.style = { ...prior, labelText: value };
    }
    if (history) history.transaction('edit edge', (rec) => rec.updateEdge(single.id, patch));
    else store.updateEdge(single.id, patch);
  };
  const reverse = (): void => {
    const swap: Partial<GraphEdge> = { source: edge.target, target: edge.source };
    if (history) history.transaction('reverse edge', (rec) => rec.updateEdge(single.id, swap));
    else store.updateEdge(single.id, swap);
  };
  return {
    kind: 'edge',
    id: single.id,
    label: '',
    type,
    data: toStringMap(edge.data),
    commit,
    reverse,
  };
}
