import { applyPatches, type Patch } from 'immer';

import type { ReactiveStore } from '../port/types';

/** Undo/redo over a {@link ReactiveStore}. Built on the patch+inverse stream. */
export interface History {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  /** Drop all recorded steps. */
  clear(): void;
  /** Stop recording (and release the change subscription). */
  dispose(): void;
}

interface Step {
  patches: Patch[];
  inverse: Patch[];
  action?: string;
}

/**
 * Inverse-patch undo/redo — it just **taps the change stream**. Every `update`
 * already carries its forward + inverse patches (immer `produceWithPatches`), so
 * undo = apply the inverse, redo = re-apply the forward. A `batch` records as one
 * step. (Under a Yjs backend this same surface delegates to Yjs's `UndoManager`;
 * the API is identical — M5.)
 */
export function createHistory<T>(store: ReactiveStore<T>, opts?: { limit?: number }): History {
  const limit = opts?.limit ?? 100;
  const undoStack: Step[] = [];
  const redoStack: Step[] = [];
  let applying = false;

  const off = store.subscribeChanges((change) => {
    if (applying) return; // our own undo/redo write — don't record it
    undoStack.push({ patches: change.patches, inverse: change.inverse, action: change.action });
    if (undoStack.length > limit) undoStack.shift();
    redoStack.length = 0;
  });

  function applyStep(patches: Patch[], action: string): void {
    applying = true;
    try {
      store.update((draft: T) => {
        applyPatches(draft as object, patches);
      }, action);
    } finally {
      applying = false;
    }
  }

  return {
    undo() {
      const step = undoStack.pop();
      if (!step) return;
      applyStep(step.inverse, `undo:${step.action ?? 'update'}`);
      redoStack.push(step);
    },
    redo() {
      const step = redoStack.pop();
      if (!step) return;
      applyStep(step.patches, `redo:${step.action ?? 'update'}`);
      undoStack.push(step);
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
    },
    dispose: off,
  };
}
