/**
 * `@invana/graph` — the ops a graph store records into the canvas's operation
 * log (`canvas.history`).
 *
 * Each recorded change is an ordered list of {@link HistoryOp}s applied to the
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
