/**
 * `@invana/graph` — undo/redo history types.
 *
 * History is a **command/transaction journal**: each undoable change is one
 * {@link HistoryEntry} holding the ordered {@link HistoryOp}s applied to the
 * {@link GraphStore}, each carrying enough state to be inverted. Inverses are
 * captured *before* the mutation runs (read-before-write), which is the only way
 * to reconstruct a deleted node/edge — the store's `node:remove` / `edge:remove`
 * events fire *after* the data is already gone.
 *
 * Since the operation log landed (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F5) the store
 * itself records every content write — `applyDelta` and the writers that wrap
 * it — as these ops, into the canvas's one log. Position writes
 * (`setPosition` / `setPositionsBulk`), runtime states and `store.internal.*`
 * are derived and never recorded.
 */

import type { GraphEdge, GraphNode, Vec2 } from '../store';

/**
 * A single invertible store mutation. `removeNode` carries the cascade-removed
 * incident `edges` so undo can restore them alongside the node, and the
 * `orphanedChildIds` whose `parentId` the store cleared when the node went
 * (removing a group unlinks its surviving members), so undo re-links them. `update*` ops
 * carry both `before` (for undo) and `after` (for redo) partial states.
 */
export type HistoryOp =
  | { kind: 'addNode'; node: GraphNode }
  /** Consecutive adds within one batch, collected (the bulk-load path). Inverse removes them, last first. */
  | { kind: 'addNodes'; nodes: GraphNode[] }
  | { kind: 'addEdges'; edges: GraphEdge[] }
  | { kind: 'removeNode'; node: GraphNode; edges: GraphEdge[]; orphanedChildIds?: string[] }
  | { kind: 'updateNode'; id: string; before: Partial<GraphNode>; after: Partial<GraphNode> }
  | { kind: 'moveNode'; id: string; before: Vec2; after: Vec2 }
  | { kind: 'addEdge'; edge: GraphEdge }
  | { kind: 'removeEdge'; edge: GraphEdge }
  | { kind: 'updateEdge'; id: string; before: Partial<GraphEdge>; after: Partial<GraphEdge> }
  /** Explicit hide / show of `ids` (only the ids whose flag actually changed). Inverse flips `hidden`. */
  | { kind: 'setHidden'; element: 'node' | 'edge'; ids: string[]; hidden: boolean }
  /** A whole-store wipe (`GraphStore.clear`), carrying what it removed. Inverse re-adds it. */
  | { kind: 'clear'; nodes: GraphNode[]; edges: GraphEdge[] };

/** One undoable unit of work — a labelled, ordered list of {@link HistoryOp}s. */
export interface HistoryEntry {
  /** Ops in application order. Undo replays inverses in reverse; redo replays forward. */
  ops: HistoryOp[];
  /** Human label for the change (e.g. `'delete selection'`, `'paste'`). */
  label?: string;
  /**
   * When the entry was recorded (or last redone), in `performance.now()` ms —
   * stamped by the operation log.
   */
  at?: number;
}

/**
 * The mutation surface handed to {@link GraphHistory.transaction}'s callback.
 * Each method applies the change to the store **and** journals its inverse.
 * Use these instead of calling `store.*` directly so the change is undoable.
 */
export interface HistoryRecorder {
  /** Add a node (inverse: remove it). */
  addNode(node: GraphNode): void;
  /** Remove a node + its incident edges, cascading (inverse: re-add node + edges). */
  removeNode(id: string): void;
  /** Patch a node (inverse: restore the patched fields' prior values). */
  updateNode(id: string, patch: Partial<GraphNode>): void;
  /** Move a node (inverse: restore the prior position). */
  moveNode(id: string, position: Vec2): void;
  /** Add an edge (inverse: remove it). */
  addEdge(edge: GraphEdge): void;
  /** Remove an edge (inverse: re-add it). */
  removeEdge(id: string): void;
  /** Patch an edge (inverse: restore the patched fields' prior values). */
  updateEdge(id: string, patch: Partial<GraphEdge>): void;
}

/** Event-map for {@link GraphHistory.events}. */
export type GraphHistoryEventMap = {
  /**
   * Fired after every undo / redo / record / clear on the log so observers can
   * re-read state. `undoDepth` counts the applied undoable entries; `redoDepth`
   * is `1` when something can be redone and `0` otherwise (the shared log does
   * not expose the length of its redo side).
   */
  change: { canUndo: boolean; canRedo: boolean; undoDepth: number; redoDepth: number };
};

/** Constructor options for {@link GraphHistory}. */
export interface GraphHistoryOptions {
  /**
   * Ignored.
   *
   * @deprecated The operation log keeps every entry (no limit, RFC G6).
   */
  limit?: number;
}
