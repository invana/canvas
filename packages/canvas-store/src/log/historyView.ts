import type { HistoryView, OperationLog } from '@invana/canvas-core';

/**
 * `canvas.history` — the read + undo surface over an {@link OperationLog}. The
 * log's recording side (`recordData`, `group`, `registerSource`) is not on it:
 * entries come only from the canvas's own writes.
 */
export function historyView(log: OperationLog): HistoryView {
  return {
    undo: () => log.undo(),
    redo: () => log.redo(),
    canUndo: () => log.canUndo(),
    canRedo: () => log.canRedo(),
    peekUndo: () => log.peekUndo(),
    peekRedo: () => log.peekRedo(),
    entries: (filter) => log.entries(filter),
    onEntry: (listener) => log.onEntry(listener),
    atLatest: () => log.atLatest(),
    subscribe: (listener) => log.subscribe(listener),
    clear: () => log.clear(),
    dispose: () => log.dispose(),
  };
}
