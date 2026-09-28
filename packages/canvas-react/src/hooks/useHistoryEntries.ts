import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { Canvas, LogEntry, LogEntryFilter } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/**
 * The canvas's applied history entries, oldest first, optionally filtered by
 * `actor` / `stepId` — as reactive React state (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F16).
 * Re-renders on every change to the log: a new entry, a merge into a streamed
 * entry, undo / redo, a playbook move, a clear.
 *
 * The array is a fresh snapshot per change and stable between changes, so it
 * is safe as a dependency. Entries themselves are the log's records — read
 * them, don't mutate them.
 *
 * @param filter `{ actor?, stepId? }`; compared by value, so an inline object is fine.
 * @param canvas Explicit engine instance; defaults to the nearest `<Canvas>`.
 */
export function useHistoryEntries(filter?: LogEntryFilter, canvas?: Canvas | null): readonly LogEntry[] {
  const history = useResolvedCanvas(canvas).history;
  const actor = filter?.actor;
  const stepId = filter?.stepId;
  const cache = useRef<{ key: unknown; entries: readonly LogEntry[] } | null>(null);
  const version = useRef(0);

  const subscribe = useCallback(
    (onChange: () => void) =>
      history.subscribe(() => {
        version.current++;
        onChange();
      }),
    [history],
  );
  const read = useCallback((): readonly LogEntry[] => {
    const key = `${version.current}\u0000${actor ?? ''}\u0000${stepId ?? ''}`;
    const hit = cache.current;
    if (hit && hit.key === key) return hit.entries;
    const entries = history.entries({
      ...(actor !== undefined ? { actor } : {}),
      ...(stepId !== undefined ? { stepId } : {}),
    });
    cache.current = { key, entries };
    return entries;
  }, [history, actor, stepId]);
  return useSyncExternalStore(subscribe, read, read);
}
