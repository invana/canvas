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
 * Only mutations routed through {@link GraphHistory.transaction} (or pushed via
 * {@link GraphHistory.push}) are recorded. Silent layout-sim position writes and
 * streaming feed deltas bypass the journal by design, so they never flood the
 * undo stack.
 */

import type { GraphEdge, GraphNode, Vec2 } from '../store';

/**
 * A single invertible store mutation. `removeNode` carries the cascade-removed
 * incident `edges` so undo can restore them alongside the node. `update*` ops
 * carry both `before` (for undo) and `after` (for redo) partial states.
 */
export type HistoryOp =
  | { kind: 'addNode'; node: GraphNode }
  | { kind: 'removeNode'; node: GraphNode; edges: GraphEdge[] }
  | { kind: 'updateNode'; id: string; before: Partial<GraphNode>; after: Partial<GraphNode> }
  | { kind: 'moveNode'; id: string; before: Vec2; after: Vec2 }
  | { kind: 'addEdge'; edge: GraphEdge }
  | { kind: 'removeEdge'; edge: GraphEdge }
  | { kind: 'updateEdge'; id: string; before: Partial<GraphEdge>; after: Partial<GraphEdge> };

/** One undoable unit of work — a labelled, ordered list of {@link HistoryOp}s. */
export interface HistoryEntry {
  /** Ops in application order. Undo replays inverses in reverse; redo replays forward. */
  ops: HistoryOp[];
  /** Human label for the change (e.g. `'delete selection'`, `'paste'`). */
  label?: string;
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
  /** Fired after every undo / redo / record / clear so observers can re-read state. */
  change: { canUndo: boolean; canRedo: boolean; undoDepth: number; redoDepth: number };
};

/** Constructor options for {@link GraphHistory}. */
export interface GraphHistoryOptions {
  /** Maximum undo depth; oldest entries are dropped past this. Default `100`. */
  limit?: number;
}
