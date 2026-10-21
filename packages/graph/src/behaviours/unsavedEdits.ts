/**
 * A board's unsaved changes as a backend takes them, and the ids a backend
 * gives back put in place.
 *
 * The tracker (`UnsavedChangesBehaviour`) folds the board's history since the
 * last save into one net change: what is new in full, what is edited as its
 * changed fields, what is deleted by id. {@link unsavedToEditOps} turns that
 * into an ordered list of {@link EditOp}s a backend applies in order:
 *
 * | Board | Op |
 * |---|---|
 * | a relationship deleted | `delete_edge` — first, so a node's deletion never takes it away underneath |
 * | a node deleted | `delete_node` |
 * | a node added | `add_node`, its board id as `ref` |
 * | a relationship added | `add_edge`, its ends by id or by a new node's `ref` |
 * | a node edited | `update_node` — the keys set and the keys removed; `from_type` when its type changed |
 * | a relationship edited | `update_edge`; with `immutableEdgeType`, a changed type is `delete_edge` + `add_edge` with the same ends |
 *
 * Keys the host hides (its own bookkeeping) are never sent. After a save,
 * {@link adoptBackendIds} swaps each new element's board id for the backend's
 * — written as the engine, so the swap is not an unsaved change.
 * {@link saveUnsaved} does both around a host's `persist`.
 */

import type { Canvas } from '@invana/canvas';
import type { GraphLayer } from '../layer/GraphLayer';
import type { GraphStore } from '../store/GraphStore';
import type { GraphEdge, GraphNode } from '../store/types';
import { isAnnotationElement } from '../annotations/annotations';
import type { UnsavedChangesBehaviour } from './UnsavedChangesBehaviour';

/** One edit, in the order a backend applies them. */
export type EditOp =
  | { op: 'add_node'; ref: string; type: string; properties: Record<string, unknown> }
  | {
      op: 'add_edge';
      ref: string;
      type: string;
      source: string;
      target: string;
      properties: Record<string, unknown>;
    }
  | {
      op: 'update_node';
      id: string;
      type: string;
      from_type?: string;
      set: Record<string, unknown>;
      unset: string[];
    }
  | { op: 'update_edge'; id: string; type: string; set: Record<string, unknown>; unset: string[] }
  | { op: 'delete_node'; id: string; type: string }
  | { op: 'delete_edge'; id: string; type: string };

export interface UnsavedToEditOpsOptions {
  /** Keys the host owns and the backend writes — never sent. Default none. */
  hidden?: (key: string) => boolean;
  /**
   * A relationship's type is fixed in the backend (a property graph's is):
   * a changed type is sent as delete + add with the same ends. Default `true`.
   */
  immutableEdgeType?: boolean;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** An element's data without the hidden keys, and without blank values. */
function shown(data: unknown, hidden: (key: string) => boolean): Record<string, unknown> {
  if (!isRecord(data)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (hidden(k) || v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

/** What changed between two data maps: the keys set to a new value, the keys gone. */
function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { set: Record<string, unknown>; unset: string[] } {
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(after)) {
    if (JSON.stringify(before[k]) !== JSON.stringify(v)) set[k] = v;
  }
  return { set, unset: Object.keys(before).filter((k) => !(k in after)) };
}

/** The tracker's unsaved changes as an ordered list of {@link EditOp}s. */
export function unsavedToEditOps(
  tracker: UnsavedChangesBehaviour,
  store: GraphStore,
  options: UnsavedToEditOpsOptions = {},
): EditOp[] {
  const { hidden = () => false, immutableEdgeType = true } = options;
  const delta = tracker.changes();
  const summary = tracker.current;
  const removes: EditOp[] = [];
  const adds: EditOp[] = [];
  const updates: EditOp[] = [];

  for (const e of summary.edges.deleted) removes.push({ op: 'delete_edge', id: e.id, type: String(e.type) });
  for (const n of summary.nodes.deleted) removes.push({ op: 'delete_node', id: n.id, type: String(n.type) });

  for (const n of delta.added?.nodes ?? [])
    adds.push({ op: 'add_node', ref: n.id, type: String(n.type), properties: shown(n.data, hidden) });
  const addEdge = (e: GraphEdge, ref = e.id) =>
    adds.push({
      op: 'add_edge',
      ref,
      type: String(e.type),
      source: e.source,
      target: e.target,
      properties: shown(e.data, hidden),
    });
  for (const e of delta.added?.edges ?? []) addEdge(e);

  for (const { id } of delta.updated?.nodes ?? []) {
    const now = store.getNode(id);
    if (!now) continue;
    const before = (tracker.before('node', id) ?? {}) as Partial<GraphNode>;
    const oldData = 'data' in before ? shown(before.data, hidden) : shown(now.data, hidden);
    const typeChanged = 'type' in before && before.type !== now.type;
    const { set, unset } = diff(oldData, shown(now.data, hidden));
    if (!typeChanged && Object.keys(set).length === 0 && unset.length === 0) continue;
    updates.push({
      op: 'update_node',
      id,
      type: String(now.type),
      ...(typeChanged ? { from_type: String(before.type) } : {}),
      set,
      unset,
    });
  }
  for (const { id } of delta.updated?.edges ?? []) {
    const now = store.getEdge(id);
    if (!now) continue;
    const before = (tracker.before('edge', id) ?? {}) as Partial<GraphEdge>;
    if (immutableEdgeType && 'type' in before && before.type !== now.type) {
      // The old relationship goes first; the new one is drawn with the same ends.
      removes.unshift({ op: 'delete_edge', id, type: String(before.type) });
      addEdge(now, id);
      continue;
    }
    const oldData = 'data' in before ? shown(before.data, hidden) : shown(now.data, hidden);
    const { set, unset } = diff(oldData, shown(now.data, hidden));
    if (Object.keys(set).length === 0 && unset.length === 0) continue;
    updates.push({ op: 'update_edge', id, type: String(now.type), set, unset });
  }
  // Nodes before the relationships that may name them.
  adds.sort((a, b) => (a.op === b.op ? 0 : a.op === 'add_node' ? -1 : 1));
  // Annotation cards, counts, frames and links are the board's drawing, never data.
  return [...removes, ...adds, ...updates].filter((op) => !isAnnotationElement(op));
}

/**
 * Give each saved new element the id the backend gave it — a node keeps its
 * place, a relationship its ends — as the engine, so the swap is not unsaved.
 * `ids` maps a board id (an op's `ref`) to the backend's.
 */
export function adoptBackendIds(store: GraphStore, ids: Record<string, string>): void {
  const moved = Object.entries(ids).filter(([ref, id]) => ref !== id);
  if (moved.length === 0) return;
  const to = new Map(moved);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const removedNodes: string[] = [];
  const removedEdges: string[] = [];
  for (const [ref, id] of moved) {
    const n = store.getNode(ref);
    if (n) {
      nodes.push({ ...n, id });
      removedNodes.push(ref);
    }
  }
  // Every relationship touching a renamed node, and every renamed relationship.
  for (const e of store.edges()) {
    const renamed = to.get(e.id);
    const source = to.get(e.source) ?? e.source;
    const target = to.get(e.target) ?? e.target;
    if (!renamed && source === e.source && target === e.target) continue;
    edges.push({ ...e, id: renamed ?? e.id, source, target });
    removedEdges.push(e.id);
  }
  store.applyDelta(
    { removed: { edgeIds: removedEdges, nodeIds: removedNodes }, added: { nodes, edges } },
    { actor: 'engine', title: 'saved ids' },
  );
}

export interface SaveUnsavedOptions extends UnsavedToEditOpsOptions {
  /** The tracker's behaviour id. Default `'unsaved-changes'`. */
  trackerId?: string;
  /** The GraphLayer edited. Default `'graph'`. */
  layerId?: string;
}

/**
 * Save the board's unsaved changes through the host's `persist` — the Changes
 * panel's `onSave`. Sends the ops as one batch, then gives new elements their
 * backend ids. Nothing to save sends nothing. A `persist` that throws keeps
 * every change; the panel marks the board saved once this resolves.
 */
export async function saveUnsaved(
  canvas: Canvas,
  persist: (ops: EditOp[]) => Promise<{ ids?: Record<string, string> } | void>,
  options: SaveUnsavedOptions = {},
): Promise<void> {
  const { trackerId = 'unsaved-changes', layerId = 'graph', ...opsOptions } = options;
  const tracker = canvas.behaviours.get<UnsavedChangesBehaviour>(trackerId);
  const store = canvas.layers.get<GraphLayer>(layerId)?.store;
  if (!tracker || !store) return;
  const ops = unsavedToEditOps(tracker, store, opsOptions);
  if (ops.length === 0) return;
  const result = await persist(ops);
  if (result?.ids) adoptBackendIds(store, result.ids);
}
