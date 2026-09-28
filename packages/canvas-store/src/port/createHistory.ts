import type { Patch, ReactiveStore, StoreChange } from '@invana/canvas-core';

import { createOperationLog } from '../log/createOperationLog';
import { historyView } from '../log/historyView';

/** What {@link History.peekUndo} / {@link History.peekRedo} report about a step. */
export interface HistoryStepInfo {
  /** The action name the recorded change carried (e.g. `'edit:control-panels'`). */
  action?: string;
  /**
   * When the step was recorded (`performance.now()`-style ms, see
   * {@link HistoryOptions.now}). Lets one Undo button arbitrate between two
   * histories by picking the newer top.
   */
  at: number;
}

/** Undo/redo over a {@link ReactiveStore}. Built on the patch+inverse stream. */
export interface History {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  /** The step {@link undo} would revert, or `undefined` when there is none. */
  peekUndo(): HistoryStepInfo | undefined;
  /** The step {@link redo} would re-apply, or `undefined` when there is none. */
  peekRedo(): HistoryStepInfo | undefined;
  /** Hear every stack change (record / undo / redo / clear). Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Drop all recorded steps. */
  clear(): void;
  /** Stop recording (and release the change subscription). */
  dispose(): void;
}

/** Options for {@link createHistory}. */
export interface HistoryOptions<T> {
  /** Maximum recorded steps; the oldest drops first. Default `100`. */
  limit?: number;
  /**
   * Which changes are recorded. Absent ⇒ every change. A view history uses it to
   * keep camera / hover / layout-progress writes off the stack.
   */
  filter?: (change: StoreChange<T>) => boolean;
  /**
   * Which patches of a recorded change are kept (applied to both the forward and
   * the inverse patches). A change left with no patches is not recorded. Absent ⇒
   * every patch.
   */
  patchFilter?: (patch: Patch) => boolean;
  /**
   * Merge a change into the previous step when both carry the **same action** and
   * arrive within this many ms of each other — so a live editor that writes on
   * every keystroke or drag frame records one step per gesture, not hundreds.
   * Absent / `0` ⇒ never merge.
   */
  mergeWithinMs?: number;
  /** Clock for {@link HistoryStepInfo.at}. Default `performance.now` (or `Date.now`). */
  now?: () => number;
}

/**
 * Inverse-patch undo/redo over one {@link ReactiveStore} — it taps the change
 * stream: undo applies a change's inverse patches, redo re-applies the forward
 * ones. A `batch` records as one step. Undo / redo write with the action
 * `undo:<action>` / `redo:<action>`.
 *
 * @deprecated Since the operation log landed (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F2) this is a
 * thin wrapper over {@link createOperationLog} + {@link historyView}; the canvas
 * no longer uses it. Build a log directly for anything new.
 */
export function createHistory<T>(store: ReactiveStore<T>, opts: HistoryOptions<T> = {}): History {
  const { filter, patchFilter } = opts;
  const log = createOperationLog<T>({
    view: store,
    classify: (patch, change) =>
      (filter && !filter(change)) || (patchFilter && !patchFilter(patch)) ? 'skip' : 'undoable',
    limit: opts.limit ?? 100,
    ...(opts.mergeWithinMs !== undefined ? { mergeWithinMs: opts.mergeWithinMs } : {}),
    ...(opts.now ? { now: opts.now } : {}),
  });
  const view = historyView(log);
  // Today's step shape: `{ action, at }` only.
  const legacy = (info: ReturnType<typeof view.peekUndo>): HistoryStepInfo | undefined =>
    info ? { ...(info.action !== undefined ? { action: info.action } : {}), at: info.at } : undefined;
  return { ...view, peekUndo: () => legacy(view.peekUndo()), peekRedo: () => legacy(view.peekRedo()) };
}
