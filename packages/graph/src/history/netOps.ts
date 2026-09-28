/**
 * Net views of a recorded op list (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`): what several
 * entries' {@link HistoryOp}s add up to.
 *
 * - {@link opsToDelta} — the net change as a `Delta`, for
 *   `history.sinceLastStep` (F14).
 * - {@link cancelOps} — the same op list with every element that was added and
 *   removed inside it dropped, for streamed entries that merge (F15).
 */

import type { Delta, DeltaRecord } from '@invana/canvas';

import type { GraphEdge, GraphNode } from '../store';
import type { HistoryOp } from './types';

/** Where one element stands after the ops, relative to before them. */
type Net<R> =
  /** Didn't exist before; `record` is its final state. */
  | { status: 'added'; record: R }
  /** Existed before and is gone. */
  | { status: 'removed' }
  /** Existed before, was removed, and a new record took the id. */
  | { status: 'replaced'; record: R }
  /** Existed before and still does; `patch` is every field written. */
  | { status: 'updated'; patch: Record<string, unknown> };

/** Fold element-level ops for one kind (nodes or edges). */
class NetBook<R extends { id: string }> {
  readonly byId = new Map<string, Net<R>>();
  /** Final explicit hidden flag per id, for ids whose flag changed. */
  readonly hidden = new Map<string, boolean>();

  add(record: R): void {
    const prev = this.byId.get(record.id);
    const copy = { ...record };
    this.byId.set(record.id, prev && prev.status !== 'added' ? { status: 'replaced', record: copy } : { status: 'added', record: copy });
  }

  remove(id: string): void {
    const prev = this.byId.get(id);
    this.hidden.delete(id);
    if (prev?.status === 'added') this.byId.delete(id);
    else this.byId.set(id, { status: 'removed' });
  }

  update(id: string, after: Record<string, unknown>): void {
    const prev = this.byId.get(id);
    if (prev?.status === 'added' || prev?.status === 'replaced') Object.assign(prev.record, after);
    else if (prev?.status === 'updated') Object.assign(prev.patch, after);
    else if (!prev) this.byId.set(id, { status: 'updated', patch: { ...after } });
  }

  setHidden(id: string, hidden: boolean): void {
    if (this.byId.get(id)?.status === 'removed') return;
    this.hidden.set(id, hidden);
  }
}

/**
 * The net change `ops` make, as a `Delta` a playbook step can carry: an add
 * and a later remove of the same id cancel, updates fold into one patch per
 * id (moves become a `position` patch), a removed-then-re-added id becomes
 * remove + add, and the last hide / show per id wins.
 */
export function opsToDelta(ops: readonly HistoryOp[]): Delta<DeltaRecord, DeltaRecord> {
  const nodes = new NetBook<GraphNode>();
  const edges = new NetBook<GraphEdge>();
  for (const op of ops) {
    switch (op.kind) {
      case 'addNode':
        nodes.add(op.node);
        break;
      case 'addNodes':
        for (const n of op.nodes) nodes.add(n);
        break;
      case 'addEdge':
        edges.add(op.edge);
        break;
      case 'addEdges':
        for (const e of op.edges) edges.add(e);
        break;
      case 'removeNode':
        for (const e of op.edges) edges.remove(e.id);
        nodes.remove(op.node.id);
        break;
      case 'removeEdge':
        edges.remove(op.edge.id);
        break;
      case 'updateNode':
        nodes.update(op.id, op.after as Record<string, unknown>);
        break;
      case 'moveNode':
        nodes.update(op.id, { position: { ...op.after } });
        break;
      case 'updateEdge':
        edges.update(op.id, op.after as Record<string, unknown>);
        break;
      case 'setHidden':
        for (const id of op.ids) (op.element === 'node' ? nodes : edges).setHidden(id, op.hidden);
        break;
      case 'clear':
        for (const e of op.edges) edges.remove(e.id);
        for (const n of op.nodes) nodes.remove(n.id);
        break;
    }
  }

  const delta: {
    added?: { nodes?: DeltaRecord[]; edges?: DeltaRecord[] };
    updated?: { nodes?: Array<{ id: string; patch: Partial<DeltaRecord> }>; edges?: Array<{ id: string; patch: Partial<DeltaRecord> }> };
    removed?: { nodeIds?: string[]; edgeIds?: string[] };
    hidden?: { nodeIds?: string[]; edgeIds?: string[] };
    shown?: { nodeIds?: string[]; edgeIds?: string[] };
  } = {};
  const put = <K extends 'nodes' | 'edges' | 'nodeIds' | 'edgeIds', V>(
    slot: 'added' | 'updated' | 'removed' | 'hidden' | 'shown',
    key: K,
    value: V,
  ): void => {
    const bucket = ((delta as Record<string, Record<string, V[]>>)[slot] ??= {});
    (bucket[key] ??= []).push(value);
  };
  for (const [book, recordKey, idKey] of [
    [nodes, 'nodes', 'nodeIds'],
    [edges, 'edges', 'edgeIds'],
  ] as const) {
    for (const [id, net] of book.byId) {
      if (net.status === 'removed' || net.status === 'replaced') put('removed', idKey, id);
      if (net.status === 'added' || net.status === 'replaced') put('added', recordKey, net.record as unknown as DeltaRecord);
      if (net.status === 'updated') put('updated', recordKey, { id, patch: net.patch as Partial<DeltaRecord> });
    }
    for (const [id, hidden] of book.hidden) put(hidden ? 'hidden' : 'shown', idKey, id);
  }
  return delta;
}

/** The node / edge id an op touches, for the ops {@link cancelOps} may drop. */
function touches(op: HistoryOp): { kind: 'node' | 'edge'; id: string } | null {
  switch (op.kind) {
    case 'updateNode':
    case 'moveNode':
      return { kind: 'node', id: op.id };
    case 'updateEdge':
      return { kind: 'edge', id: op.id };
    default:
      return null;
  }
}

/**
 * Drop every element that `ops` both add and remove, with every op on it in
 * between — the merge step for streamed entries (F15). Replaying the result
 * forward or back reaches the same states as `ops`.
 *
 * Conservative: a `removeNode` that orphaned children (`orphanedChildIds`) and
 * whole-store `clear` ops are kept as recorded, and so is everything on the
 * elements they touch.
 */
export function cancelOps(ops: readonly HistoryOp[]): HistoryOp[] {
  // Pass 1: which ids are added and later removed inside `ops`.
  const addedNodes = new Set<string>();
  const addedEdges = new Set<string>();
  const cancelNodes = new Set<string>();
  const cancelEdges = new Set<string>();
  /** Ids a kept removal or clear touches — never cancelled. */
  const pinnedNodes = new Set<string>();
  const pinnedEdges = new Set<string>();
  for (const op of ops) {
    switch (op.kind) {
      case 'addNode':
        addedNodes.add(op.node.id);
        break;
      case 'addNodes':
        for (const n of op.nodes) addedNodes.add(n.id);
        break;
      case 'addEdge':
        addedEdges.add(op.edge.id);
        break;
      case 'addEdges':
        for (const e of op.edges) addedEdges.add(e.id);
        break;
      case 'removeEdge':
        if (addedEdges.has(op.edge.id)) cancelEdges.add(op.edge.id);
        break;
      case 'removeNode': {
        const keep = (op.orphanedChildIds?.length ?? 0) > 0 || !addedNodes.has(op.node.id);
        if (keep) {
          pinnedNodes.add(op.node.id);
          for (const e of op.edges) if (!addedEdges.has(e.id)) pinnedEdges.add(e.id);
        } else cancelNodes.add(op.node.id);
        // An added edge cascaded away with the node goes either way.
        for (const e of op.edges) if (addedEdges.has(e.id)) cancelEdges.add(e.id);
        break;
      }
      case 'clear':
        for (const n of op.nodes) pinnedNodes.add(n.id);
        for (const e of op.edges) pinnedEdges.add(e.id);
        break;
    }
  }
  for (const id of pinnedNodes) cancelNodes.delete(id);
  for (const id of pinnedEdges) cancelEdges.delete(id);
  if (cancelNodes.size === 0 && cancelEdges.size === 0) return [...ops];

  // Pass 2: drop them.
  const out: HistoryOp[] = [];
  for (const op of ops) {
    switch (op.kind) {
      case 'addNode':
        if (!cancelNodes.has(op.node.id)) out.push(op);
        continue;
      case 'addNodes': {
        const nodes = op.nodes.filter((n) => !cancelNodes.has(n.id));
        if (nodes.length > 0) out.push(nodes.length === op.nodes.length ? op : { kind: 'addNodes', nodes });
        continue;
      }
      case 'addEdge':
        if (!cancelEdges.has(op.edge.id)) out.push(op);
        continue;
      case 'addEdges': {
        const edges = op.edges.filter((e) => !cancelEdges.has(e.id));
        if (edges.length > 0) out.push(edges.length === op.edges.length ? op : { kind: 'addEdges', edges });
        continue;
      }
      case 'removeEdge':
        if (!cancelEdges.has(op.edge.id)) out.push(op);
        continue;
      case 'removeNode': {
        if (cancelNodes.has(op.node.id)) continue;
        const edges = op.edges.filter((e) => !cancelEdges.has(e.id));
        out.push(edges.length === op.edges.length ? op : { ...op, edges });
        continue;
      }
      case 'setHidden': {
        const gone = op.element === 'node' ? cancelNodes : cancelEdges;
        const ids = op.ids.filter((id) => !gone.has(id));
        if (ids.length > 0) out.push(ids.length === op.ids.length ? op : { ...op, ids });
        continue;
      }
      default: {
        const t = touches(op);
        if (t && (t.kind === 'node' ? cancelNodes : cancelEdges).has(t.id)) continue;
        out.push(op);
      }
    }
  }
  return out;
}
