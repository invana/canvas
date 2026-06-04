/**
 * `GraphHistory` — undo/redo for a {@link GraphStore}.
 *
 * A **command/transaction journal**, not a snapshot store and not a passive
 * event listener. Mutations are recorded only when routed through
 * {@link GraphHistory.transaction} (or {@link GraphHistory.push}); everything
 * else — streaming feed deltas, silent layout-sim position writes — bypasses the
 * journal, so the undo stack stays meaningful and small.
 *
 * @example
 * ```ts
 * const history = new GraphHistory(layer.store);
 * history.transaction('delete selection', (rec) => {
 *   for (const id of selectedIds) rec.removeNode(id);
 * });
 * history.undo(); // restores the nodes + their incident edges
 * ```
 */

import { EventEmitter } from '@invana/canvas';

import type { GraphStore } from '../store';
import type { GraphEdge, GraphNode, Vec2 } from '../store';
import type {
  GraphHistoryEventMap,
  GraphHistoryOptions,
  HistoryEntry,
  HistoryOp,
  HistoryRecorder,
} from './types';

const DEFAULT_LIMIT = 100;

export class GraphHistory {
  /** Fires `change` after every mutation so observers can re-read undo/redo state. */
  readonly events = new EventEmitter<GraphHistoryEventMap>();

  private readonly store: GraphStore;
  private readonly limit: number;

  private readonly undoStack: HistoryEntry[] = [];
  private readonly redoStack: HistoryEntry[] = [];

  /** Ops buffer for the in-flight transaction. Non-null only while recording. */
  private recording: HistoryOp[] | null = null;
  /** Nesting depth — only the outermost `transaction` commits an entry. */
  private depth = 0;

  constructor(store: GraphStore, opts: GraphHistoryOptions = {}) {
    this.store = store;
    this.limit = opts.limit ?? DEFAULT_LIMIT;
  }

  // ─── Public state ─────────────────────────────────────────────────────────

  /** True iff there is at least one entry that can be undone. */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** True iff there is at least one undone entry that can be redone. */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // ─── Recording ────────────────────────────────────────────────────────────

  /**
   * Run `fn`'s mutations as one undoable entry. Mutations MUST go through the
   * {@link HistoryRecorder} passed to `fn` to be journaled. The whole body runs
   * inside {@link GraphStore.batch}, so the canvas sees a single flush. Nested
   * `transaction` calls merge into the outermost entry. Returns `fn`'s result.
   */
  transaction<T>(label: string, fn: (rec: HistoryRecorder) => T): T {
    const outermost = this.depth === 0;
    if (outermost) this.recording = [];
    this.depth++;
    let result: T;
    try {
      result = this.store.batch(() => fn(this.recorder));
    } finally {
      this.depth--;
      if (outermost) {
        const ops = this.recording ?? [];
        this.recording = null;
        if (ops.length > 0) this.commit({ ops, label });
      }
    }
    return result;
  }

  /**
   * Record an already-applied entry. Escape hatch for mutations that happen
   * outside {@link transaction} — e.g. a drag behaviour that writes positions
   * during the gesture and, on release, pushes a single `moveNode` op with the
   * captured start/end positions. The ops are assumed to be applied already;
   * this only journals them.
   */
  push(entry: HistoryEntry): void {
    if (entry.ops.length === 0) return;
    this.commit(entry);
  }

  // ─── Undo / redo ──────────────────────────────────────────────────────────

  /** Revert the most recent entry and move it onto the redo stack. No-op if empty. */
  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;
    this.store.batch(() => {
      for (let i = entry.ops.length - 1; i >= 0; i--) this.applyInverse(entry.ops[i]!);
    });
    this.redoStack.push(entry);
    this.emitChange();
  }

  /** Re-apply the most recently undone entry and move it back onto the undo stack. */
  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    this.store.batch(() => {
      for (const op of entry.ops) this.applyForward(op);
    });
    this.undoStack.push(entry);
    this.emitChange();
  }

  /** Wipe both stacks. Use when loading a fresh dataset. */
  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.emitChange();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private commit(entry: HistoryEntry): void {
    this.undoStack.push(entry);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    // Any new recorded change invalidates the redo branch.
    this.redoStack.length = 0;
    this.emitChange();
  }

  private emitChange(): void {
    this.events.emit('change', {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoDepth: this.undoStack.length,
      redoDepth: this.redoStack.length,
    });
  }

  /**
   * The recorder handed to `transaction` callbacks. Each method applies the
   * change to the store and appends its op (carrying the pre-mutation state) to
   * the in-flight ops buffer.
   */
  private readonly recorder: HistoryRecorder = {
    addNode: (node) => {
      this.store.addNode(node);
      this.record({ kind: 'addNode', node: { ...node } });
    },
    removeNode: (id) => {
      const node = this.store.getNode(id);
      if (!node) return;
      const edges = this.incidentEdges(id);
      this.store.removeNode(id, { cascade: true });
      this.record({ kind: 'removeNode', node, edges });
    },
    updateNode: (id, patch) => {
      const before = this.captureNodeBefore(id, patch);
      if (before === null) return;
      this.store.updateNode(id, patch);
      this.record({ kind: 'updateNode', id, before, after: { ...patch } });
    },
    moveNode: (id, position) => {
      const before = this.store.getPosition(id);
      if (!before) return;
      this.store.setPosition(id, position);
      this.record({ kind: 'moveNode', id, before, after: { ...position } });
    },
    addEdge: (edge) => {
      this.store.addEdge(edge);
      this.record({ kind: 'addEdge', edge: { ...edge } });
    },
    removeEdge: (id) => {
      const edge = this.store.getEdge(id);
      if (!edge) return;
      this.store.removeEdge(id);
      this.record({ kind: 'removeEdge', edge });
    },
    updateEdge: (id, patch) => {
      const before = this.captureEdgeBefore(id, patch);
      if (before === null) return;
      this.store.updateEdge(id, patch);
      this.record({ kind: 'updateEdge', id, before, after: { ...patch } });
    },
  };

  private record(op: HistoryOp): void {
    // Outside a transaction (shouldn't happen via recorder) drop silently.
    this.recording?.push(op);
  }

  /** Snapshot the patched fields' prior values for a node. `null` if unknown id. */
  private captureNodeBefore(id: string, patch: Partial<GraphNode>): Partial<GraphNode> | null {
    const node = this.store.getNode(id);
    if (!node) return null;
    const before: Partial<GraphNode> = {};
    for (const key of Object.keys(patch) as (keyof GraphNode)[]) {
      (before as Record<string, unknown>)[key] = node[key];
    }
    return before;
  }

  private captureEdgeBefore(id: string, patch: Partial<GraphEdge>): Partial<GraphEdge> | null {
    const edge = this.store.getEdge(id);
    if (!edge) return null;
    const before: Partial<GraphEdge> = {};
    for (const key of Object.keys(patch) as (keyof GraphEdge)[]) {
      (before as Record<string, unknown>)[key] = edge[key];
    }
    return before;
  }

  /** Cloned incident edges (both directions), deduped — self-loops appear once. */
  private incidentEdges(nodeId: string): GraphEdge[] {
    const seen = new Set<string>();
    const out: GraphEdge[] = [];
    for (const edge of this.store.edgesOf(nodeId, 'both')) {
      if (seen.has(edge.id)) continue;
      seen.add(edge.id);
      out.push(edge);
    }
    return out;
  }

  // ─── Replay (no re-journal — calls plain store.* directly) ─────────────────

  private applyForward(op: HistoryOp): void {
    switch (op.kind) {
      case 'addNode':
        if (!this.store.hasNode(op.node.id)) this.store.addNode(op.node);
        break;
      case 'removeNode':
        if (this.store.hasNode(op.node.id)) this.store.removeNode(op.node.id, { cascade: true });
        break;
      case 'updateNode':
        this.store.updateNode(op.id, op.after);
        break;
      case 'moveNode':
        this.store.setPosition(op.id, op.after);
        break;
      case 'addEdge':
        if (!this.store.hasEdge(op.edge.id)) this.store.addEdge(op.edge);
        break;
      case 'removeEdge':
        if (this.store.hasEdge(op.edge.id)) this.store.removeEdge(op.edge.id);
        break;
      case 'updateEdge':
        this.store.updateEdge(op.id, op.after);
        break;
    }
  }

  private applyInverse(op: HistoryOp): void {
    switch (op.kind) {
      case 'addNode':
        if (this.store.hasNode(op.node.id)) this.store.removeNode(op.node.id, { cascade: true });
        break;
      case 'removeNode':
        if (!this.store.hasNode(op.node.id)) this.store.addNode(op.node);
        this.readdEdges(op.edges);
        break;
      case 'updateNode':
        this.store.updateNode(op.id, op.before);
        break;
      case 'moveNode':
        this.store.setPosition(op.id, op.before);
        break;
      case 'addEdge':
        if (this.store.hasEdge(op.edge.id)) this.store.removeEdge(op.edge.id);
        break;
      case 'removeEdge':
        if (!this.store.hasEdge(op.edge.id)) this.store.addEdge(op.edge);
        break;
      case 'updateEdge':
        this.store.updateEdge(op.id, op.before);
        break;
    }
  }

  /** Re-add edges whose both endpoints exist; skip duplicates and danglers. */
  private readdEdges(edges: GraphEdge[]): void {
    for (const edge of edges) {
      if (this.store.hasEdge(edge.id)) continue;
      if (!this.store.hasNode(edge.source) || !this.store.hasNode(edge.target)) continue;
      this.store.addEdge(edge);
    }
  }
}

/** Re-export Vec2 for callers that build `moveNode` ops. */
export type { Vec2 };
