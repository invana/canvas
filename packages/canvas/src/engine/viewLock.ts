/**
 * The view lock — "Lock" is app policy, not an engine concept: it disables a
 * configurable set of behaviours (pan + node drag by default) and leaves zoom
 * live. Plain functions over a `Canvas`, shared by the `view.lock` command and
 * `@invana/canvas-react`'s `useLock`, so a panel toggle and a hook can't
 * disagree about whether the view is locked.
 */

import type { Canvas } from './Canvas';

/** Behaviours the lock disables by default — pan + node drag; zoom stays live. */
const DEFAULT_LOCK_IDS: readonly string[] = ['pan', 'drag-node'];

/** The ids of `behaviourIds` (default pan + drag-node) that are registered on `canvas`. */
function lockTargets(canvas: Canvas, behaviourIds?: readonly string[]): string[] {
  return (behaviourIds ?? DEFAULT_LOCK_IDS).filter((id) => canvas.behaviours.has(id));
}

/**
 * Whether the view is locked: at least one targeted behaviour is registered
 * and every registered one is disabled.
 *
 * @param behaviourIds Behaviours the lock covers. Default `['pan', 'drag-node']`.
 */
export function isViewLocked(canvas: Canvas, behaviourIds?: readonly string[]): boolean {
  const ids = lockTargets(canvas, behaviourIds);
  return ids.length > 0 && ids.every((id) => !canvas.behaviours.get(id)?.enabled);
}

/**
 * Lock (disable) or unlock (enable) the targeted behaviours that are
 * registered. Goes through the registry, so `scene:behaviour:enable` /
 * `disable` fire and bound controls re-read. Unregistered ids are skipped.
 *
 * @param behaviourIds Behaviours the lock covers. Default `['pan', 'drag-node']`.
 */
export function setViewLocked(canvas: Canvas, locked: boolean, behaviourIds?: readonly string[]): void {
  for (const id of lockTargets(canvas, behaviourIds)) canvas.behaviours.setEnabled(id, !locked);
}

/** Whether any targeted behaviour is registered — a lock control is only useful then. */
export function canLockView(canvas: Canvas, behaviourIds?: readonly string[]): boolean {
  return lockTargets(canvas, behaviourIds).length > 0;
}
