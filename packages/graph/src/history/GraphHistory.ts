/**
 * `GraphHistory` — undo/redo for a {@link GraphStore}, over the canvas's **one
 * operation log**.
 *
 * The store records its own content writes (`applyDelta` and the writers that
 * wrap it) into the log it is attached to — the canvas's, once its `GraphLayer`
 * mounts. `GraphHistory` is the graph-flavoured handle on that log: it groups
 * writes into one labelled entry ({@link transaction}), journals an
 * already-applied gesture ({@link push}), and undoes / redoes. Because the log is
 * shared, undo is linear across data and view edits — it takes back the newest
 * change on the canvas, whichever layer or editor made it (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F4).
 *
 * A store with no log (a standalone store, a layer not yet mounted) gets a
 * private one on construction, so this class works headless too; the store
 * switches to the canvas's log when its layer mounts, and this follows.
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

import { EventEmitter, createOperationLog, type LogEntry, type OperationLog } from '@invana/canvas';

import type { GraphStore } from '../store';
import type { Vec2 } from '../store';
import type {
  GraphHistoryEventMap,
  GraphHistoryOptions,
  HistoryEntry,
  HistoryRecorder,
} from './types';

/** Whether plain undo can take `entry` back (it has a data part or an undoable view part). */
const undoable = (entry: LogEntry): boolean => entry.parts.some((p) => p.kind === 'data' || p.undoable);

export class GraphHistory {
  /** Fires `change` after every record / undo / redo / clear on the log, so observers can re-read state. */
  readonly events = new EventEmitter<GraphHistoryEventMap>();

  private readonly store: GraphStore;
  /** Unsubscribes from the current log's changes. */
  private offLog: (() => void) | null = null;
  private readonly offAttach: () => void;

  /**
   * @param store The graph store to journal. Given no log yet, it gets a private one.
   * @param opts Deprecated: `limit` is ignored — the log has no limit.
   */
  constructor(store: GraphStore, opts: GraphHistoryOptions = {}) {
    void opts;
    this.store = store;
    if (!store.operationLog) store.attachLog(createOperationLog());
    this.follow(store.operationLog);
    this.offAttach = store.onLogAttached((log) => {
      this.follow(log);
      // A detach means the layer is going; its removal already re-notifies
      // bound controls, so only a new log is news.
      if (log) this.emitChange();
    });
  }

  /** The log this history reads — the store's current one, or `undefined` once detached. */
  private get log(): OperationLog | undefined {
    return this.store.operationLog;
  }

  private follow(log: OperationLog | undefined): void {
    this.offLog?.();
    this.offLog = log ? log.subscribe(() => this.emitChange()) : null;
  }

  // ─── Public state ─────────────────────────────────────────────────────────

  /** True iff there is at least one entry that can be undone. */
  get canUndo(): boolean {
    return this.log?.canUndo() ?? false;
  }

  /** True iff there is at least one undone entry that can be redone. */
  get canRedo(): boolean {
    return this.log?.canRedo() ?? false;
  }

  /** The entry {@link undo} would revert (label + `at`), or `undefined`. */
  peekUndo(): Pick<HistoryEntry, 'label' | 'at'> | undefined {
    const info = this.log?.peekUndo();
    return info ? { label: info.title ?? info.action, at: info.at } : undefined;
  }

  /** The entry {@link redo} would re-apply (label + `at`), or `undefined`. */
  peekRedo(): Pick<HistoryEntry, 'label' | 'at'> | undefined {
    const info = this.log?.peekRedo();
    return info ? { label: info.title ?? info.action, at: info.at } : undefined;
  }

  // ─── Recording ────────────────────────────────────────────────────────────

  /**
   * Run `fn`'s mutations as one undoable entry labelled `label`. The body runs
   * inside {@link GraphStore.batch}, so the canvas sees a single flush. Nested
   * `transaction` calls merge into the outermost entry. Returns `fn`'s result.
   *
   * The {@link HistoryRecorder} is kept for compatibility — the store records
   * its own writes now, so plain `store.*` calls inside `fn` join the entry too.
   */
  transaction<T>(label: string, fn: (rec: HistoryRecorder) => T): T {
    const run = (): T => this.store.batch(() => fn(this.recorder));
    const log = this.log;
    return log ? log.group({ title: label }, run) : run();
  }

  /**
   * Record an already-applied entry. Escape hatch for mutations made
   * unrecorded — e.g. a drag that writes positions every frame and, on
   * release, pushes one `moveNode` op per node with the captured start / end
   * positions. The ops are assumed to be applied already; this only journals them.
   */
  push(entry: HistoryEntry): void {
    this.store.recordApplied(entry.ops, entry.label !== undefined ? { title: entry.label } : {});
  }

  // ─── Undo / redo ──────────────────────────────────────────────────────────

  /** Revert the newest undoable entry on the log. No-op if there is none. */
  undo(): void {
    this.log?.undo();
  }

  /** Re-apply the most recently undone entry. */
  redo(): void {
    this.log?.redo();
  }

  /**
   * The maximum undo depth — always `Infinity`.
   *
   * @deprecated The operation log has no limit (RFC G6).
   */
  get maxDepth(): number {
    return Infinity;
  }

  /**
   * No-op.
   *
   * @deprecated The operation log has no limit (RFC G6).
   */
  setLimit(limit: number): void {
    void limit;
  }

  /** Wipe the log — every entry, not only this store's. Use when loading a fresh dataset. */
  clear(): void {
    this.log?.clear();
  }

  /** Stop following the store's log. The log itself (and its entries) stays. */
  dispose(): void {
    this.offLog?.();
    this.offLog = null;
    this.offAttach();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private emitChange(): void {
    const applied = this.log?.entries() ?? [];
    let undoDepth = 0;
    for (const entry of applied) if (undoable(entry)) undoDepth++;
    this.events.emit('change', {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoDepth,
      redoDepth: this.canRedo ? 1 : 0,
    });
  }

  /**
   * The recorder handed to `transaction` callbacks: the store's own writers
   * (which record themselves). `moveNode` goes through `updateNode` because a
   * bare position write is derived and unrecorded.
   */
  private readonly recorder: HistoryRecorder = {
    addNode: (node) => this.store.addNode(node),
    removeNode: (id) => this.store.removeNode(id, { cascade: true }),
    updateNode: (id, patch) => this.store.updateNode(id, patch),
    moveNode: (id, position) => {
      if (this.store.hasNode(id)) this.store.updateNode(id, { position: { ...position } });
    },
    addEdge: (edge) => this.store.addEdge(edge),
    removeEdge: (id) => this.store.removeEdge(id),
    updateEdge: (id, patch) => this.store.updateEdge(id, patch),
  };
}

/** Re-export Vec2 for callers that build `moveNode` ops. */
export type { Vec2 };
