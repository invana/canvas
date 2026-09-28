/**
 * The operation-log vocabulary — what the canvas records (history) and what a
 * playbook replays (steps). Types only: the log itself (`createOperationLog`)
 * lives in `@invana/canvas-store`, the one data door (`GraphStore.applyDelta`)
 * in `@invana/graph`.
 *
 * Two directions, never mixed (RFC
 * `docs/rfcs/feat/2026-09-28-an-analysis-cannot-be-recorded-or-replayed.md`,
 * D-7):
 *
 * - **History = record.** {@link OperationLog} is written only by the canvas —
 *   view patches from the reactive store and data ops from each registered
 *   {@link DataOpAdapter} — and carries a free-text `actor` on every
 *   {@link LogEntry}. {@link HistoryView} is its read + undo surface
 *   (`canvas.history`).
 * - **Playbook = script.** A list of JSON {@link StepSpec}s; playing one calls
 *   the ordinary canvas methods, and history records the result like any other
 *   change.
 */

import type { Patch } from '../port/types';

// ─── Record: entries and their parts ─────────────────────────────────────────

/**
 * A **view** share of a change: reactive-store patches plus their inverse.
 * `undoable: false` marks view intent that is recorded but skipped by plain
 * undo (selection, focus) — a step, or `revertTo`, still reverts it.
 */
export interface ViewLogPart {
  kind: 'view';
  /** The action the store change carried (e.g. `'edit:control-panels'`). */
  action?: string;
  /** Forward patches (apply to the state before → the state after). */
  patches: Patch[];
  /** Inverse patches (apply to the state after → the state before). */
  inverse: Patch[];
  /** Whether plain undo / redo applies this part. */
  undoable: boolean;
}

/**
 * A **data** share of a change: ops against one registered data source, in
 * application order. The ops are opaque to the log — the source's
 * {@link DataOpAdapter} knows how to replay them (a graph source records its
 * `HistoryOp`s).
 */
export interface DataLogPart {
  kind: 'data';
  /** Which {@link DataOpAdapter} replays these ops. */
  sourceId: string;
  /** Ops in application order. Undo replays their inverses in reverse. */
  ops: unknown[];
}

/** One source's share of a change. A single {@link LogEntry} can hold both kinds. */
export type LogPart = ViewLogPart | DataLogPart;

/**
 * One history entry — one undo step. Kept for the life of the canvas (no
 * limit); `clear()` runs only when a new canvas state loads.
 */
export interface LogEntry {
  /** Stable id, unique within the log. */
  id: string;
  /** When the entry was recorded (or last merged into), in `performance.now()` ms. */
  at: number;
  /**
   * Who made the change — free text (`'user'`, `'user:ravi'`, `'engine'`,
   * `'assistant'`, `'feed:twitter'`). Defaults to the canvas's session actor.
   */
  actor: string;
  /** Human label: a playbook step's title, a graph transaction's label (`'paste'`). */
  title?: string;
  /** Set when a playbook step produced the entry. */
  stepId?: string;
  /** The parts, in the order they were recorded. */
  parts: LogPart[];
}

/** Filter for {@link OperationLog.entries}. Absent fields match everything. */
export interface LogEntryFilter {
  actor?: string;
  stepId?: string;
}

/** What {@link HistoryView.peekUndo} / {@link HistoryView.peekRedo} report about an entry. */
export interface LogStepInfo {
  /** The action of the entry's first view part, when it has one. */
  action?: string;
  /** The entry's title, when it has one. */
  title?: string;
  /** The entry's actor. */
  actor: string;
  /** When the entry was recorded. */
  at: number;
}

// ─── Data: the one door's shape ──────────────────────────────────────────────

/**
 * The one shape data changes take — `GraphStore.applyDelta`'s argument, and a
 * playbook step's `data`. Applied in this order: `removed` (edges, then nodes,
 * cascading), `added` (nodes, then edges; an existing id merges), `updated`
 * (nodes, then edges), then `hidden`, `shown` and `pinned`. Unknown ids are
 * skipped.
 *
 * Generic over the record types so the vocabulary stays domain-free; a graph
 * source instantiates it with its node / edge records.
 */
export interface Delta<N extends { id: string } = { id: string }, E extends { id: string } = { id: string }> {
  added?: { nodes?: readonly N[]; edges?: readonly E[] };
  updated?: {
    nodes?: ReadonlyArray<{ id: string; patch: Partial<N> }>;
    edges?: ReadonlyArray<{ id: string; patch: Partial<E> }>;
  };
  removed?: { nodeIds?: readonly string[]; edgeIds?: readonly string[] };
  /** Set the explicit hidden flag on these ids. */
  hidden?: { nodeIds?: readonly string[]; edgeIds?: readonly string[] };
  /** Clear the explicit hidden flag on these ids. */
  shown?: { nodeIds?: readonly string[]; edgeIds?: readonly string[] };
  /**
   * Pin (default) or unpin nodes. `x` / `y`, when both are given, also move the
   * node there — a drag's final position.
   */
  pinned?: ReadonlyArray<{ id: string; pinned?: boolean; x?: number; y?: number }>;
}

/**
 * A record in a playbook step's {@link Delta}: an id plus whatever fields the
 * source's records carry (`type`, `data`, `source` / `target` …). Open, because
 * the vocabulary is domain-free; the source checks the shape when it applies.
 */
export type DeltaRecord = { id: string } & Record<string, unknown>;

/** Options for a recorded data write (`applyDelta(delta, opts)`). */
export interface DeltaOptions {
  /** Who the history entry is attributed to. Default: the canvas's session actor. */
  actor?: string;
}

// ─── The log (internal to the canvas) ────────────────────────────────────────

/**
 * A data source the log can replay: it applies its own recorded ops forward or
 * backward. Registered with {@link OperationLog.registerSource}; replay runs
 * with recording suspended, so the source's writes during it are not recorded
 * again.
 */
export interface DataOpAdapter {
  /** Matches {@link DataLogPart.sourceId}. */
  readonly sourceId: string;
  /** Re-apply `ops` in order (`'forward'`) or their inverses in reverse (`'back'`). */
  applyOps(ops: readonly unknown[], direction: 'forward' | 'back'): void;
  /**
   * The source's one recorded data door (a graph store's `applyDelta`). A
   * playbook step's `data` goes through it. Absent ⇒ the source takes no
   * steps.
   */
  applyDelta?(delta: Delta, opts?: DeltaOptions): void;
  /** Whether the source holds an element with this id — a step's view ids are checked against it. */
  hasElement?(id: string): boolean;
}

/** Where an entry id stands in the log: applied, waiting to be redone, or not (or no longer) in it. */
export type LogEntryStatus = 'applied' | 'pending' | 'unknown';

/** Metadata for {@link OperationLog.group}. */
export interface LogGroupMeta {
  title?: string;
  actor?: string;
  stepId?: string;
}

/**
 * The one operation log behind `canvas.history`. **Written only by the canvas**
 * — the view store's change stream and each data source's recorded writes; a
 * consumer reads it through {@link HistoryView}.
 *
 * Undo is linear across actors (D-10): it takes back the newest undoable entry,
 * whoever made it. Entries with no undoable part (a selection change) are kept
 * in the record but stepped over. A change after an undo keeps the undone
 * entries as a side branch rather than discarding them.
 */
export interface OperationLog {
  /** Register a data source for replay. Returns the unregister. */
  registerSource(adapter: DataOpAdapter): () => void;
  /** The registered source with this id, or `undefined`. */
  source(sourceId: string): DataOpAdapter | undefined;
  /**
   * Where `entryId` stands: `'applied'`, `'pending'` (undone, waiting to be
   * redone) or `'unknown'` (never recorded, or moved to a side branch by a
   * change after an undo). A playbook asks before replaying a step's entries.
   */
  status(entryId: string): LogEntryStatus;
  /**
   * Record already-applied data ops as one part. Outside a {@link group} it is
   * its own entry; inside, it joins the open one. Dropped while the log is
   * replaying.
   */
  recordData(sourceId: string, ops: readonly unknown[], actor?: string): void;
  /** Run `fn`; everything recorded meanwhile becomes one entry. Nested groups merge. */
  group<T>(meta: LogGroupMeta, fn: () => T): T;
  /** Whether the log is applying entries (undo / redo / revertTo / replayTo) right now. */
  readonly replaying: boolean;

  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  peekUndo(): LogStepInfo | undefined;
  peekRedo(): LogStepInfo | undefined;
  /** Revert every applied entry after `entryId` (`null` = back to the start), every part included. */
  revertTo(entryId: string | null): void;
  /** Re-apply recorded entries up to and including `entryId`, every part included. */
  replayTo(entryId: string): void;
  /** True when no recorded entry is waiting to be redone. */
  atLatest(): boolean;

  /** The applied entries, oldest first, optionally filtered. */
  entries(filter?: LogEntryFilter): readonly LogEntry[];
  /** Hear every new entry. Returns the unsubscribe. */
  onEntry(listener: (entry: LogEntry) => void): () => void;
  /** Hear every change to the log (record / merge / undo / redo / clear). Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Drop every entry and branch. Runs when a new canvas state loads. */
  clear(): void;
  /** Stop recording and release subscriptions. */
  dispose(): void;
}

/**
 * `canvas.history` — the record. Undo / redo as before, plus who-did-what reads.
 * Nobody writes to it: entries come from the canvas's own writes.
 */
export interface HistoryView {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  /** The entry {@link undo} would revert, or `undefined`. */
  peekUndo(): LogStepInfo | undefined;
  /** The entry {@link redo} would re-apply, or `undefined`. */
  peekRedo(): LogStepInfo | undefined;
  /** The applied entries, oldest first, optionally filtered by actor / step. */
  entries(filter?: LogEntryFilter): readonly LogEntry[];
  /** Hear every new entry (e.g. to send a user's changes back to the engine). */
  onEntry(listener: (entry: LogEntry) => void): () => void;
  /** True when no recorded entry is waiting to be redone. */
  atLatest(): boolean;
  /** Hear every change (record / undo / redo / clear). Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Drop every entry. */
  clear(): void;
  /** Stop recording and release subscriptions. */
  dispose(): void;
}

// ─── Script: playbook steps ──────────────────────────────────────────────────

/** Where a step points the camera: its focus, every visible node, or everything. */
export type CameraIntent = 'focus' | 'visible' | 'all';

/**
 * One playbook step — what should happen, as plain JSON. Ids and values only;
 * no functions, no rules. The Invana engine answers prompts in this format.
 *
 * @typeParam S The settings patch shape — `CanvasConfig` in `@invana/canvas`.
 */
export interface StepSpec<S = Record<string, unknown>> {
  id: string;
  title: string;
  /** Who the resulting history entry is attributed to. */
  actor?: string;
  /** Presenter text. */
  narration?: string;
  /** The engine's own data; never read by the canvas. */
  meta?: unknown;
  /** Data source id; defaults to the playbook's. */
  source?: string;
  /** Exactly `applyDelta`'s argument, with the source's records as plain JSON. */
  data?: Delta<DeltaRecord, DeltaRecord>;
  /** Exactly `canvas.update`'s argument. */
  settings?: S;
  view?: {
    /** Selected ids; `[]` clears. */
    select?: string[];
    /** Highlighted ids, the rest optionally dimmed; `null` clears. */
    focus?: { ids: string[]; dim?: boolean } | null;
    /** The node whose properties are open; `null` closes. */
    inspect?: string | null;
    camera?: CameraIntent;
  };
  /** Rare verbs that leave no state (export, redraw), run after the rest. */
  do?: Array<{ command: string; args?: Record<string, unknown> }>;
}

/** A saved playbook: the script, nothing more. */
export interface PlaybookSpec<S = Record<string, unknown>> {
  version: 1;
  title: string;
  /** Default data source id for its steps. */
  source?: string;
  steps: StepSpec<S>[];
}

/**
 * `canvas.playbook` — a list of {@link StepSpec}s and a position. `addStep` only
 * appends; moving to a step plays it (or replays / reverts its recorded entries).
 */
export interface Playbook<S = Record<string, unknown>> {
  /** The script's title (from {@link load}, else `'Playbook'`). */
  readonly title: string;
  readonly steps: readonly StepSpec<S>[];
  /** The step the canvas is at, or `undefined` before the first. */
  readonly current: StepSpec<S> | undefined;
  /** Index of {@link current} in {@link steps}; `-1` before the first. */
  readonly index: number;
  /** Append to the list; the canvas does not change. Returns the step id. Throws on a duplicate id. */
  addStep(spec: StepSpec<S>): string;
  /**
   * Play the next step — or replay it, when it was played and then stepped
   * back over. Rejects (writing nothing) when the step fails validation.
   * Resolves once its `do` verbs finished and the canvas settled.
   */
  next(): Promise<void>;
  /** Revert the current step's recorded entries and move back one. */
  previous(): Promise<void>;
  /** Move to `stepId`, playing / reverting every step in between. */
  goTo(stepId: string): Promise<void>;
  toJSON(): PlaybookSpec<S>;
  /** Replace the list; the canvas does not change. */
  load(doc: PlaybookSpec<S>): Promise<void>;
  /** Hear every change to the list or the position. Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}
