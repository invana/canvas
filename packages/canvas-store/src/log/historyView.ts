import type {
  Delta,
  DeltaRecord,
  HistoryView,
  LogEntry,
  OperationLog,
  StepSpec,
  ViewLogPart,
} from '@invana/canvas-core';

import { stepLinks } from './stepLinks';

/** Options for {@link historyView}. */
export interface HistoryViewOptions {
  /**
   * Summarise the view parts recorded since the last step as a step's
   * `settings` and `view` — the engine supplies it, because it knows how the
   * definition maps onto a `canvas.update` patch. Absent ⇒ `sinceLastStep`
   * carries data only.
   */
  describeView?(parts: readonly ViewLogPart[]): { settings?: unknown; view?: StepSpec['view'] };
}

/** Whether `delta` changes nothing. */
function isEmptyDelta(delta: Delta<DeltaRecord, DeltaRecord>): boolean {
  const sizes = [
    delta.added?.nodes?.length,
    delta.added?.edges?.length,
    delta.updated?.nodes?.length,
    delta.updated?.edges?.length,
    delta.removed?.nodeIds?.length,
    delta.removed?.edgeIds?.length,
    delta.hidden?.nodeIds?.length,
    delta.hidden?.edgeIds?.length,
    delta.shown?.nodeIds?.length,
    delta.shown?.edgeIds?.length,
    delta.pinned?.length,
  ];
  return sizes.every((n) => !n);
}

/**
 * `canvas.history` — the read + undo surface over an {@link OperationLog}. The
 * log's recording side (`recordData`, `group`, `registerSource`) is not on it:
 * entries come only from the canvas's own writes.
 */
export function historyView(log: OperationLog, opts: HistoryViewOptions = {}): HistoryView {
  function sinceLastStep<S>(title: string): StepSpec<S> {
    const applied = log.entries();
    let start = applied.length;
    while (start > 0 && applied[start - 1]!.stepId === undefined) start--;
    const covered: readonly LogEntry[] = applied.slice(start);
    const before = start > 0 ? applied[start - 1]!.id : null;
    const step: StepSpec<S> = {
      id: `since-${covered.length > 0 ? covered[covered.length - 1]!.id : (before ?? 'start')}`,
      title,
    };
    if (covered.length === 0) return step;

    // Data: the net delta of the first source that changed. A step names one
    // source, so a change spread over several keeps only the first's.
    const opsBySource = new Map<string, unknown[]>();
    const viewParts: ViewLogPart[] = [];
    for (const entry of covered) {
      for (const part of entry.parts) {
        if (part.kind === 'view') viewParts.push(part);
        else {
          const list = opsBySource.get(part.sourceId) ?? [];
          list.push(...part.ops);
          opsBySource.set(part.sourceId, list);
        }
      }
    }
    for (const [sourceId, ops] of opsBySource) {
      const delta = log.source(sourceId)?.toDelta?.(ops);
      if (!delta || isEmptyDelta(delta)) continue;
      step.source = sourceId;
      step.data = delta;
      break;
    }
    if (viewParts.length > 0 && opts.describeView) {
      const { settings, view } = opts.describeView(viewParts);
      if (settings !== undefined) step.settings = settings as S;
      if (view !== undefined && Object.keys(view).length > 0) step.view = view;
    }
    stepLinks.set(step, { log, before, entryIds: covered.map((e) => e.id) });
    return step;
  }

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
    sinceLastStep,
    subscribe: (listener) => log.subscribe(listener),
    clear: () => log.clear(),
    dispose: () => log.dispose(),
  };
}
