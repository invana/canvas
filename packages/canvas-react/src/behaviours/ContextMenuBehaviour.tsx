import { useEffect } from 'react';
import * as graph from '@invana/graph';
import {
  type ContextMenuBehaviourOptions,
} from '@invana/graph';

import { useCanvas } from '../CanvasContext';
import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface ContextMenuBehaviourProps
  extends Omit<ContextMenuBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'context-menu'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes/edges this behaviour watches; default `'graph'`. */
  targetLayerId?: string;
}

/**
 * Declarative wrapper for `@invana/graph` `ContextMenuBehaviour`.
 *
 * Headless — pass `onContextMenu` to receive node/edge/canvas right-click
 * events and render your own menu. `enabled` and `onContextMenu` are reactive
 * (synced in place); `id` / `targetLayerId` are identity — change them (or the
 * `key`) to recreate.
 *
 * `onContextMenu` must stay reactive: menu builders routinely close over state
 * that settles *after* mount (the undo `history` from `GraphHistoryProvider`,
 * the active tool, …). Freezing the first closure would leave those items
 * wired to stale `null`s, so the wrapper re-syncs it via `setOptions` on every
 * change rather than capturing it once at construction.
 */
export function ContextMenuBehaviour({
  id = 'context-menu',
  targetLayerId = 'graph',
  enabled = true,
  ...rest
}: ContextMenuBehaviourProps) {
  const canvas = useCanvas();
  useBehaviourRegistration(
    () => new graph.ContextMenuBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );

  // Keep the menu-building callback live — the registration effect above only
  // captures the closure present at mount (when `history` etc. are still null).
  const { onContextMenu } = rest;
  useEffect(() => {
    canvas.behaviours.get<graph.ContextMenuBehaviour>(id)?.setOptions({ onContextMenu });
  }, [canvas, id, onContextMenu]);

  return null;
}
