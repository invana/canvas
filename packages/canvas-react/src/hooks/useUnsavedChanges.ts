import type { Canvas } from '@invana/canvas';
import type { UnsavedChangesBehaviour, UnsavedChangesSummary } from '@invana/graph';
import { useCallback, useSyncExternalStore } from 'react';

import { useBehaviourInstance } from './useBehaviourInstance';

const NONE: UnsavedChangesSummary = {
  count: 0,
  nodes: { new: [], edited: [], deleted: [] },
  edges: { new: [], edited: [], deleted: [] },
};

/** What `useUnsavedChanges` hands a component. */
export interface UnsavedChanges {
  /** Elements new, edited or deleted since the last save. */
  count: number;
  /** Which ones. */
  summary: UnsavedChangesSummary;
  /** The tracker, or `null` while none is registered. Its `changes()` is the net delta to save. */
  tracker: UnsavedChangesBehaviour | null;
  /** Put the board back at the last save, as one undoable entry. */
  discard: () => void;
  /** Call once the host's save succeeded: the board as it stands is saved. */
  markSaved: () => void;
}

/**
 * The board's unsaved changes, live — for a footer bar, a Save button, a prompt
 * before leaving. Follows the `UnsavedChangesBehaviour` registered as `id`
 * (default `'unsaved-changes'`); with none, a count of 0 and no-op acts.
 */
export function useUnsavedChanges(id = 'unsaved-changes', canvas?: Canvas | null): UnsavedChanges {
  const tracker = useBehaviourInstance<UnsavedChangesBehaviour>(id, canvas);
  const subscribe = useCallback(
    (onChange: () => void) => (tracker ? tracker.events.on('change', onChange) : () => {}),
    [tracker],
  );
  const get = useCallback(() => (tracker ? tracker.current : NONE), [tracker]);
  const summary = useSyncExternalStore(subscribe, get, get);
  const discard = useCallback(() => tracker?.discard(), [tracker]);
  const markSaved = useCallback(() => tracker?.markSaved(), [tracker]);
  return { count: summary.count, summary, tracker, discard, markSaved };
}
