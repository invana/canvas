/**
 * `GraphClipboard` — copy / cut / paste / delete for a {@link GraphStore}.
 *
 * Holds an in-memory buffer of cloned node/edge specs. It does **not** read the
 * current selection itself — the caller passes the ids in (the canvas-react
 * `useClipboard` hook reads them off a `ClickSelectBehaviour`). This keeps the
 * clipboard decoupled from the selection mechanism and trivially testable.
 *
 * cut / paste / delete each run as a single undoable {@link GraphHistory}
 * transaction when a history instance is supplied; otherwise they fall back to a
 * plain {@link GraphStore.batch} (one flush, not undoable).
 *
 * @example
 * ```ts
 * const clipboard = new GraphClipboard(layer.store);
 * clipboard.copy(selectedNodeIds, selectedEdgeIds);
 * const { nodeIds } = clipboard.paste(history); // offset + re-id'd
 * clickSelect.selectMultiple(nodeIds.map((id) => ({ id })));
 * ```
 */

import { EventEmitter } from '@invana/canvas';

import type { GraphStore } from '../store';
import type { GraphEdge, GraphNode, Vec2 } from '../store';
import type { GraphHistory, HistoryRecorder } from '../history';

const DEFAULT_OFFSET: Vec2 = { x: 24, y: 24 };

/** Event-map for {@link GraphClipboard.events}. */
export type GraphClipboardEventMap = {
  /** Fired whenever the buffer's contents change (copy / clear). Drives "can paste". */
  change: { hasContent: boolean };
};

/** Constructor options for {@link GraphClipboard}. */
export interface GraphClipboardOptions {
  /** Offset applied to pasted node positions to avoid exact overlap. Default `{x:24,y:24}`. */
  pasteOffset?: Vec2;
  /**
   * Candidate id generator for pasted nodes/edges. Called with increasing
   * `attempt` until the returned id is free. Default `${oldId}-copy[-N]`.
   */
  remapId?: (oldId: string, attempt: number) => string;
}

/** Ids produced by a {@link GraphClipboard.paste}. */
export interface PasteResult {
  nodeIds: string[];
  edgeIds: string[];
}

function defaultRemapId(oldId: string, attempt: number): string {
  return attempt === 0 ? `${oldId}-copy` : `${oldId}-copy-${attempt}`;
}

export class GraphClipboard {
  /** Fires `change` whenever the buffer's contents change (copy / clear). */
  readonly events = new EventEmitter<GraphClipboardEventMap>();

  private readonly store: GraphStore;
  private readonly pasteOffset: Vec2;
  private readonly remapId: (oldId: string, attempt: number) => string;

  private bufferedNodes: GraphNode[] = [];
  private bufferedEdges: GraphEdge[] = [];

  constructor(store: GraphStore, opts: GraphClipboardOptions = {}) {
    this.store = store;
    this.pasteOffset = opts.pasteOffset ?? DEFAULT_OFFSET;
    this.remapId = opts.remapId ?? defaultRemapId;
  }

  /** True iff the buffer holds at least one node or edge (drives "can paste"). */
  get hasContent(): boolean {
    return this.bufferedNodes.length > 0 || this.bufferedEdges.length > 0;
  }

  /** Empty the buffer. */
  clearBuffer(): void {
    this.bufferedNodes = [];
    this.bufferedEdges = [];
    this.events.emit('change', { hasContent: false });
  }

  /**
   * Snapshot the given ids into the buffer (clones, so later store mutations
   * don't mutate the buffer). Unknown ids are skipped. Replaces prior contents.
   */
  copy(nodeIds: readonly string[], edgeIds: readonly string[] = []): void {
    this.bufferedNodes = [];
    this.bufferedEdges = [];
    // Skip effectively-hidden elements — you only copy what you can see, so a
    // paste never silently produces invisible nodes/edges.
    for (const id of nodeIds) {
      if (this.store.isNodeHidden(id)) continue;
      const node = this.store.getNode(id);
      if (node) this.bufferedNodes.push(node);
    }
    for (const id of edgeIds) {
      if (!this.store.isEdgeVisible(id)) continue;
      const edge = this.store.getEdge(id);
      if (edge) this.bufferedEdges.push(edge);
    }
    this.events.emit('change', { hasContent: this.hasContent });
  }

  /** Copy the ids into the buffer, then delete them as one undoable transaction. */
  cut(nodeIds: readonly string[], edgeIds: readonly string[], history?: GraphHistory): void {
    this.copy(nodeIds, edgeIds);
    this.removeAsTransaction('cut', nodeIds, edgeIds, history);
  }

  /** Delete the given ids as one undoable transaction. Buffer is left untouched. */
  delete(nodeIds: readonly string[], edgeIds: readonly string[], history?: GraphHistory): void {
    this.removeAsTransaction('delete', nodeIds, edgeIds, history);
  }

  /**
   * Insert the buffer with fresh ids (collision-free) and a position offset, as
   * one undoable transaction. Only buffered edges whose **both** endpoints were
   * also buffered are pasted, with endpoints remapped to the new node ids.
   * `parentId` is remapped when the parent was pasted too, else dropped.
   *
   * Returns the new ids so the caller can re-select the pasted items.
   */
  paste(history?: GraphHistory): PasteResult {
    if (!this.hasContent) return { nodeIds: [], edgeIds: [] };

    // Build the id remap up front so edge endpoints can be resolved.
    const nodeIdMap = new Map<string, string>();
    const taken = new Set<string>();
    for (const node of this.bufferedNodes) {
      nodeIdMap.set(node.id, this.freshId(node.id, taken));
    }

    const newNodes: GraphNode[] = this.bufferedNodes.map((node) => {
      const next: GraphNode = { ...node, id: nodeIdMap.get(node.id)! };
      if (node.position) {
        next.position = {
          x: node.position.x + this.pasteOffset.x,
          y: node.position.y + this.pasteOffset.y,
        };
      }
      if (node.parentId !== undefined) {
        const mapped = nodeIdMap.get(node.parentId);
        if (mapped) next.parentId = mapped;
        else delete next.parentId;
      }
      return next;
    });

    const newEdges: GraphEdge[] = [];
    for (const edge of this.bufferedEdges) {
      const source = nodeIdMap.get(edge.source);
      const target = nodeIdMap.get(edge.target);
      if (!source || !target) continue; // dangling — endpoint wasn't copied
      newEdges.push({ ...edge, id: this.freshId(edge.id, taken), source, target });
    }

    const apply = (rec: HistoryRecorder): PasteResult => {
      for (const node of newNodes) rec.addNode(node);
      for (const edge of newEdges) rec.addEdge(edge);
      return { nodeIds: newNodes.map((n) => n.id), edgeIds: newEdges.map((e) => e.id) };
    };

    if (history) return history.transaction('paste', apply);
    return this.store.batch(() => apply(this.plainRecorder()));
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /** Remove explicit edges first, then nodes (cascade), mirroring `applyDelta`. */
  private removeAsTransaction(
    label: string,
    nodeIds: readonly string[],
    edgeIds: readonly string[],
    history?: GraphHistory,
  ): void {
    const run = (rec: HistoryRecorder): void => {
      for (const id of edgeIds) if (this.store.hasEdge(id)) rec.removeEdge(id);
      for (const id of nodeIds) if (this.store.hasNode(id)) rec.removeNode(id);
    };
    if (history) history.transaction(label, run);
    else this.store.batch(() => run(this.plainRecorder()));
  }

  /** Pick the first remapped id that is neither already in the store nor reserved. */
  private freshId(oldId: string, taken: Set<string>): string {
    let attempt = 0;
    let candidate = this.remapId(oldId, attempt);
    while (this.store.hasNode(candidate) || this.store.hasEdge(candidate) || taken.has(candidate)) {
      attempt++;
      candidate = this.remapId(oldId, attempt);
    }
    taken.add(candidate);
    return candidate;
  }

  /**
   * A recorder that mutates the store directly without journaling — used when no
   * {@link GraphHistory} is supplied so paste/cut/delete still run as one batch.
   */
  private plainRecorder(): HistoryRecorder {
    return {
      addNode: (node) => this.store.addNode(node),
      removeNode: (id) => this.store.removeNode(id, { cascade: true }),
      updateNode: (id, patch) => this.store.updateNode(id, patch),
      moveNode: (id, position) => this.store.setPosition(id, position),
      addEdge: (edge) => this.store.addEdge(edge),
      removeEdge: (id) => this.store.removeEdge(id),
      updateEdge: (id, patch) => this.store.updateEdge(id, patch),
    };
  }
}
