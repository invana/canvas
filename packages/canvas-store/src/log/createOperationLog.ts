import { applyPatches, type Patch as ImmerPatch } from 'immer';

import type {
  DataLogPart,
  DataOpAdapter,
  LogEntry,
  LogEntryFilter,
  LogGroupMeta,
  LogPart,
  LogStepInfo,
  OperationLog,
  Patch,
  ReactiveStore,
  StoreChange,
  ViewLogPart,
} from '@invana/canvas-core';

// Side effect: opts immer into Map/Set drafting + patches, which replaying a
// selection `Set` patch needs even when no store was built through `patch.ts`.
import '../port/patch';

/**
 * How the log treats one view-store patch:
 *
 * - `'undoable'` — recorded; plain undo / redo applies it (a Studio `edit:*`).
 * - `'record'` — recorded, but plain undo steps over it (selection, focus). A
 *   `revertTo` / `replayTo` still applies it, so a playbook step keeps its view.
 * - `'skip'` — not recorded (camera frames, hover, layout progress, programmatic
 *   config).
 */
export type ViewPatchMode = 'undoable' | 'record' | 'skip';

/** Options for {@link createOperationLog}. */
export interface OperationLogOptions<T> {
  /** The view store whose change stream is recorded. Absent ⇒ data parts only. */
  view?: ReactiveStore<T>;
  /** The session actor stamped on entries that name none. Default `'user'`. */
  actor?: () => string;
  /**
   * Classify each view patch (the forward and the inverse lists are classified
   * independently, as `createHistory`'s `patchFilter` was). Default: every patch
   * is `'undoable'`.
   */
  classify?: (patch: Patch, change: StoreChange<T>) => ViewPatchMode;
  /**
   * Merge an undoable view change into the newest entry when both carry the
   * same action and actor and arrive within this many ms — so a live editor
   * writing per keystroke records one step per gesture. Absent / `0` ⇒ never.
   */
  mergeWithinMs?: number;
  /**
   * Maximum entries kept; the oldest applied entry drops first. Default: no
   * limit (the canvas keeps its whole session). Exists for the deprecated
   * `createHistory` wrapper.
   */
  limit?: number;
  /** Clock for {@link LogEntry.at}. Default `performance.now` (or `Date.now`). */
  now?: () => number;
}

const defaultNow = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

/** What a replay of an entry applies: its undoable parts only, or every part. */
type ReplayScope = 'undoable' | 'all';

/** Whether plain undo can take `entry` back — it holds a data part or an undoable view part. */
function isUndoable(entry: LogEntry): boolean {
  return entry.parts.some((p) => p.kind === 'data' || p.undoable);
}

function stepInfo(entry: LogEntry | undefined): LogStepInfo | undefined {
  if (!entry) return undefined;
  const view = entry.parts.find((p): p is ViewLogPart => p.kind === 'view');
  return {
    ...(view?.action !== undefined ? { action: view.action } : {}),
    ...(entry.title !== undefined ? { title: entry.title } : {}),
    actor: entry.actor,
    at: entry.at,
  };
}

/**
 * The canvas's **one operation log** — the record behind `canvas.history`
 * (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, G1).
 *
 * It taps the view store's patch + inverse stream (as `createHistory` did) and
 * takes data ops from each registered source (`GraphStore.applyDelta`), so one
 * entry can hold both — a change that touches data and view undoes in one call.
 * Every entry carries a free-text `actor`.
 *
 * - **Linear undo across actors.** Undo reverts the newest entry with an
 *   undoable part and moves it to the redo side, stepping over record-only
 *   entries (selection, focus), which stay applied.
 * - **Record-only entries never branch.** They join the applied side without
 *   discarding a redo tail — clicking a node after an undo keeps the redo.
 * - **Branches, not discards.** An undoable change after an undo moves the redo
 *   tail to a kept side branch.
 * - **No limit** by default; replays run with recording suspended, so nothing a
 *   replay writes is recorded again.
 *
 * View replays write with the action `undo:<action>` / `redo:<action>`, so a
 * store subscriber can tell a history write from an ordinary one (the engine's
 * definition reconciler keys on that).
 */
export function createOperationLog<T>(opts: OperationLogOptions<T> = {}): OperationLog {
  const now = opts.now ?? defaultNow;
  const sessionActor = opts.actor ?? (() => 'user');
  const classify = opts.classify ?? ((): ViewPatchMode => 'undoable');
  const mergeWithinMs = opts.mergeWithinMs ?? 0;
  const limit = opts.limit ?? Infinity;
  const view = opts.view;

  /** Entries `[0, cursor)` are applied; `[cursor, length)` wait to be redone. */
  const entries: LogEntry[] = [];
  let cursor = 0;
  /** Redo tails cut off by a new change after an undo — kept, never shown as history. */
  const branches: LogEntry[][] = [];
  /** What a reverted entry had taken back, so a redo re-applies exactly that. */
  const reverted = new WeakMap<LogEntry, ReplayScope>();
  const sources = new Map<string, DataOpAdapter>();
  const listeners = new Set<() => void>();
  const entryListeners = new Set<(entry: LogEntry) => void>();
  /** The entry a {@link OperationLog.group} is filling, or `null`. */
  let open: LogEntry | null = null;
  let replaying = false;
  let seq = 0;

  const notify = (): void => {
    for (const l of [...listeners]) l();
  };

  const newEntry = (actor: string, meta: LogGroupMeta = {}): LogEntry => ({
    id: `e${++seq}`,
    at: now(),
    actor,
    ...(meta.title !== undefined ? { title: meta.title } : {}),
    ...(meta.stepId !== undefined ? { stepId: meta.stepId } : {}),
    parts: [],
  });

  /** Put `part` into `entry`, concatenating onto a same-source data part. */
  function pushPart(entry: LogEntry, part: LogPart): void {
    const last = entry.parts[entry.parts.length - 1];
    if (part.kind === 'data' && last?.kind === 'data' && last.sourceId === part.sourceId) {
      last.ops.push(...part.ops);
      return;
    }
    entry.parts.push(part);
  }

  function append(entry: LogEntry): void {
    if (isUndoable(entry)) {
      if (cursor < entries.length) branches.push(entries.splice(cursor));
      entries.push(entry);
      cursor = entries.length;
    } else {
      // Record-only: applied, but it must not cut off what is waiting to be redone.
      entries.splice(cursor, 0, entry);
      cursor++;
    }
    while (entries.length > limit && cursor > 0) {
      entries.shift();
      cursor--;
    }
    for (const l of [...entryListeners]) l(entry);
    notify();
  }

  /** Record `parts` as one entry (or into the open group). */
  function record(parts: LogPart[], actor: string): void {
    if (parts.length === 0) return;
    if (open) {
      for (const part of parts) pushPart(open, part);
      return;
    }
    const entry = newEntry(actor);
    for (const part of parts) pushPart(entry, part);
    append(entry);
  }

  /** Merge a lone undoable view part into the newest entry when {@link OperationLogOptions.mergeWithinMs} allows. */
  function tryMerge(part: ViewLogPart, actor: string): boolean {
    if (mergeWithinMs <= 0 || open || !part.undoable || part.action === undefined) return false;
    if (cursor !== entries.length) return false;
    const top = entries[cursor - 1];
    if (!top || top.actor !== actor || top.stepId !== undefined || top.parts.length !== 1) return false;
    const prev = top.parts[0]!;
    if (prev.kind !== 'view' || !prev.undoable || prev.action !== part.action) return false;
    const at = now();
    if (at - top.at > mergeWithinMs) return false;
    // Forward replays old then new; inverse undoes new then old.
    prev.patches = [...prev.patches, ...part.patches];
    prev.inverse = [...part.inverse, ...prev.inverse];
    top.at = at;
    notify();
    return true;
  }

  const offView = view?.subscribeChanges((change) => {
    if (replaying) return;
    const split = (list: Patch[]): Record<Exclude<ViewPatchMode, 'skip'>, Patch[]> => {
      const out = { undoable: [] as Patch[], record: [] as Patch[] };
      for (const p of list) {
        const mode = classify(p, change);
        if (mode !== 'skip') out[mode].push(p);
      }
      return out;
    };
    const fwd = split(change.patches);
    const inv = split(change.inverse);
    const parts: ViewLogPart[] = [];
    const action = change.action;
    for (const mode of ['undoable', 'record'] as const) {
      if (fwd[mode].length === 0 && inv[mode].length === 0) continue;
      parts.push({
        kind: 'view',
        ...(action !== undefined ? { action } : {}),
        patches: fwd[mode],
        inverse: inv[mode],
        undoable: mode === 'undoable',
      });
    }
    if (parts.length === 0) return;
    const actor = sessionActor();
    if (parts.length === 1 && tryMerge(parts[0]!, actor)) return;
    record(parts, actor);
  });

  /** Apply `entry` forward or back, limited to `scope`, with recording suspended. */
  function run(entry: LogEntry, direction: 'forward' | 'back', scope: ReplayScope): void {
    const parts = direction === 'back' ? [...entry.parts].reverse() : entry.parts;
    replaying = true;
    try {
      for (const part of parts) {
        if (part.kind === 'view') {
          if (scope === 'undoable' && !part.undoable) continue;
          if (!view) continue;
          const patches = direction === 'back' ? part.inverse : part.patches;
          view.update((draft: T) => {
            applyPatches(draft as object, patches as ImmerPatch[]);
          }, `${direction === 'back' ? 'undo' : 'redo'}:${part.action ?? 'update'}`);
        } else {
          // A source that has gone (its layer removed) can't be replayed; skip it.
          sources.get(part.sourceId)?.applyOps(part.ops, direction);
        }
      }
    } finally {
      replaying = false;
    }
  }

  function revertEntry(entry: LogEntry, scope: ReplayScope): void {
    run(entry, 'back', scope);
    reverted.set(entry, scope);
  }

  function reapplyEntry(entry: LogEntry): void {
    run(entry, 'forward', reverted.get(entry) ?? 'all');
    reverted.delete(entry);
  }

  /** Index of the entry plain undo would revert, or `-1`. */
  function undoIndex(): number {
    let i = cursor - 1;
    while (i >= 0 && !isUndoable(entries[i]!)) i--;
    return i;
  }

  const indexOf = (id: string): number => entries.findIndex((e) => e.id === id);

  return {
    registerSource(adapter) {
      sources.set(adapter.sourceId, adapter);
      return () => {
        if (sources.get(adapter.sourceId) === adapter) sources.delete(adapter.sourceId);
      };
    },

    source: (sourceId) => sources.get(sourceId),

    status(entryId) {
      const i = indexOf(entryId);
      if (i < 0) return 'unknown';
      return i < cursor ? 'applied' : 'pending';
    },

    recordData(sourceId, ops, actor) {
      if (replaying || ops.length === 0) return;
      const part: DataLogPart = { kind: 'data', sourceId, ops: [...ops] };
      record([part], actor ?? sessionActor());
    },

    group(meta, fn) {
      if (open) {
        // Nested: merge into the outermost entry; fill in what it left unset.
        if (open.title === undefined && meta.title !== undefined) open.title = meta.title;
        if (open.stepId === undefined && meta.stepId !== undefined) open.stepId = meta.stepId;
        return fn();
      }
      open = newEntry(meta.actor ?? sessionActor(), meta);
      try {
        return fn();
      } finally {
        const entry = open;
        open = null;
        if (entry.parts.length > 0) {
          entry.at = now();
          append(entry);
        }
      }
    },

    get replaying() {
      return replaying;
    },

    undo() {
      if (open) return;
      const i = undoIndex();
      if (i < 0) return;
      const entry = entries[i]!;
      revertEntry(entry, 'undoable');
      // Move it just past the record-only entries it was stepped over, which
      // stay applied: `[0, cursor)` stays exactly the applied set.
      entries.splice(i, 1);
      entries.splice(cursor - 1, 0, entry);
      cursor--;
      notify();
    },

    redo() {
      if (open || cursor >= entries.length) return;
      const entry = entries[cursor]!;
      reapplyEntry(entry);
      cursor++;
      entry.at = now();
      notify();
    },

    canUndo: () => undoIndex() >= 0,
    canRedo: () => cursor < entries.length,
    peekUndo: () => stepInfo(entries[undoIndex()]),
    peekRedo: () => stepInfo(entries[cursor]),

    revertTo(entryId) {
      const target = entryId === null ? 0 : indexOf(entryId) + 1;
      if (entryId !== null && target === 0) return;
      if (cursor <= target) return;
      while (cursor > target) revertEntry(entries[--cursor]!, 'all');
      notify();
    },

    replayTo(entryId) {
      const target = indexOf(entryId) + 1;
      if (target <= cursor) return;
      while (cursor < target) reapplyEntry(entries[cursor++]!);
      notify();
    },

    atLatest: () => cursor === entries.length,

    entries(filter?: LogEntryFilter) {
      const applied = entries.slice(0, cursor);
      if (!filter || (filter.actor === undefined && filter.stepId === undefined)) return applied;
      return applied.filter(
        (e) =>
          (filter.actor === undefined || e.actor === filter.actor) &&
          (filter.stepId === undefined || e.stepId === filter.stepId),
      );
    },

    onEntry(listener) {
      entryListeners.add(listener);
      return () => entryListeners.delete(listener);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    clear() {
      if (entries.length === 0 && branches.length === 0) return;
      entries.length = 0;
      branches.length = 0;
      cursor = 0;
      notify();
    },

    dispose() {
      offView?.();
      listeners.clear();
      entryListeners.clear();
    },
  };
}
