import { applyPatches, type Patch as ImmerPatch } from 'immer';

import type { Patch, ReactiveStore, StoreChange } from '@invana/canvas-core';

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

interface Step extends HistoryStepInfo {
  patches: Patch[];
  inverse: Patch[];
}

const defaultNow = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

/**
 * Inverse-patch undo/redo — it just **taps the change stream**. Every `update`
 * already carries its forward + inverse patches (immer `produceWithPatches`), so
 * undo = apply the inverse, redo = re-apply the forward. A `batch` records as one
 * step. (Under a Yjs backend this same surface delegates to Yjs's `UndoManager`;
 * the API is identical — M5.)
 *
 * Undo / redo write with the action `undo:<action>` / `redo:<action>`, so a
 * subscriber to the store can tell a history write from an ordinary one.
 */
export function createHistory<T>(store: ReactiveStore<T>, opts: HistoryOptions<T> = {}): History {
  const limit = opts.limit ?? 100;
  const now = opts.now ?? defaultNow;
  const keep = opts.patchFilter;
  const mergeWithinMs = opts.mergeWithinMs ?? 0;
  const undoStack: Step[] = [];
  const redoStack: Step[] = [];
  const listeners = new Set<() => void>();
  let applying = false;

  const notify = (): void => {
    for (const l of [...listeners]) l();
  };

  const off = store.subscribeChanges((change) => {
    if (applying) return; // our own undo/redo write — don't record it
    if (opts.filter && !opts.filter(change)) return;
    const patches = keep ? change.patches.filter(keep) : change.patches;
    const inverse = keep ? change.inverse.filter(keep) : change.inverse;
    if (patches.length === 0 && inverse.length === 0) return;
    const at = now();
    const top = undoStack[undoStack.length - 1];
    if (
      top &&
      mergeWithinMs > 0 &&
      redoStack.length === 0 &&
      change.action !== undefined &&
      top.action === change.action &&
      at - top.at <= mergeWithinMs
    ) {
      // Forward replays old then new; inverse undoes new then old.
      top.patches = [...top.patches, ...patches];
      top.inverse = [...inverse, ...top.inverse];
      top.at = at;
      notify();
      return;
    }
    undoStack.push({ patches, inverse, action: change.action, at });
    if (undoStack.length > limit) undoStack.shift();
    redoStack.length = 0;
    notify();
  });

  function applyStep(patches: Patch[], action: string): void {
    applying = true;
    try {
      store.update((draft: T) => {
        applyPatches(draft as object, patches as ImmerPatch[]);
      }, action);
    } finally {
      applying = false;
    }
  }

  const info = (step: Step | undefined): HistoryStepInfo | undefined =>
    step ? { action: step.action, at: step.at } : undefined;

  return {
    undo() {
      const step = undoStack.pop();
      if (!step) return;
      applyStep(step.inverse, `undo:${step.action ?? 'update'}`);
      redoStack.push(step);
      notify();
    },
    redo() {
      const step = redoStack.pop();
      if (!step) return;
      applyStep(step.patches, `redo:${step.action ?? 'update'}`);
      // A redone step is the newest thing on the undo stack again.
      step.at = now();
      undoStack.push(step);
      notify();
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    peekUndo: () => info(undoStack[undoStack.length - 1]),
    peekRedo: () => info(redoStack[redoStack.length - 1]),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear() {
      if (undoStack.length === 0 && redoStack.length === 0) return;
      undoStack.length = 0;
      redoStack.length = 0;
      notify();
    },
    dispose() {
      off();
      listeners.clear();
    },
  };
}
